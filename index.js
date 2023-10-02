async function main() {
  try {
    const main = dce("div");
    document.body.appendChild(main);

    // main.innerHTML = "Loading...";

    const libav = await initLibAV();

    const resolutionPicker = document.getElementById("resolutionPicker");
    const techniquePicker = document.getElementById("techniquePicker");
    const videoPicker = document.getElementById("videoPicker");
    const filePicker = document.getElementById("filePicker");

    function hidePickers() {
      resolutionPicker.style.display = "none";
      techniquePicker.style.display = "none";
      videoPicker.style.display = "none";
      filePicker.style.display = "none";
    }

    videoPicker.addEventListener("change", async (event) => {
      if (videoPicker.value === "") {
        return;
      }
      hidePickers();
      const blob = await fetchFile(videoPicker.value);
      await run(blob);
    });

    filePicker.addEventListener("change", async (event) => {
      if (filePicker.files.length === 0) {
        return;
      }

      hidePickers();
      await run(filePicker.files[0]);
    });

    async function run(file) {
      let frameCounter = 0;

      // Initial read
      await libav.mkreadaheadfile("input", file);
      const [fmt_ctx, streams] = await libav.ff_init_demuxer_file("input");

      // Find the video stream (FIXME: eventually audio stream too?)
      let videoIdx = -1;
      for (let i = 0; i < streams.length; i++) {
        if (streams[i].codec_type === libav.AVMEDIA_TYPE_VIDEO) {
          videoIdx = i;
          break;
        }
      }
      if (videoIdx < 0) {
        main.innerHTML = "Error! Couldn't find video stream!";
        return;
      }

      const videoStream = streams[videoIdx];

      const codecparPtr = videoStream.codecpar;

      const resolutionMultipler = parseFloat(resolutionPicker.value);
      const width = await libav.AVCodecParameters_width(codecparPtr);
      const height = await libav.AVCodecParameters_height(codecparPtr);
      //   console.log(`${width}x${height}`);
      //   console.log(videoStream);

      // Set up the "player"
      main.innerHTML = "";
      //   const durationBox = dce("div");
      //   durationBox.innerHTML = `0/${videoStream.duration}`;
      //   main.appendChild(durationBox);
      const statsBox = dce("div");

      statsBox.innerHTML = "&nbsp;";
      main.appendChild(statsBox);
      const renderChk = dce("input");
      renderChk.style.display = "none";
      renderChk.type = "checkbox";
      renderChk.checked = true;
      main.appendChild(renderChk);
      const canvas = dce("canvas");
      canvas.style.display = "block";
      canvas.width = width * resolutionMultipler;
      canvas.height = height * resolutionMultipler;
      canvas.style.width = `${
        (width * resolutionMultipler) / devicePixelRatio
      }px`;
      canvas.style.height = `${
        (height * resolutionMultipler) / devicePixelRatio
      }px`;
      main.appendChild(canvas);
      const cctx = canvas.getContext("2d");
      const seeker = dce("input");
      seeker.type = "range";
      seeker.min = 0;
      seeker.max = Math.ceil(videoStream.duration * 10);
      seeker.style.visibility = "hidden";
      main.appendChild(seeker);
      let seekerWakeup = null;

      // Prepare to seek
      let seeked = false;
      seeker.oninput = async () => {
        let frameCounter = 0;
        const ts =
          ((seeker.value / 10) * videoStream.time_base_den) /
          videoStream.time_base_num;
        const ret = await libav.avformat_seek_file_max(
          fmt_ctx,
          videoIdx,
          ts,
          0
        );
        seeked = true;
        if (seekerWakeup) {
          const w = seekerWakeup;
          seekerWakeup = null;
          w();
        }
      };

      // Initialize the decoder
      const [, codecContextPtr, pkt, frame] = await initDecoder(
        libav,
        videoStream.codec_id,
        videoStream.codecpar
      );

      // Prepare to initialize the scaler (for pixel format)
      let inW = -1,
        inH = -1,
        inF = -1;
      let sctx = null;
      const sinFrame = await libav.av_frame_alloc();
      const soutFrame = await libav.av_frame_alloc();

      // Prepare for stats
      const stats = [];

      const id = cctx.createImageData(
        width * resolutionMultipler,
        height * resolutionMultipler
      );

      let buffersrc_ctx, buffersink_ctx;
      if (techniquePicker.value === "format_filter") {
        const [_buffersrc_ctx, _buffersink_ctx] = await init_filters(
          libav,
          width,
          height,
          "yuv422p10le",
          // "1/25"
          "1/12800"
        );
        buffersrc_ctx = _buffersrc_ctx;
        buffersink_ctx = _buffersink_ctx;
      }

      const hasAlpha = true;
      const targetPixFormat = hasAlpha
        ? libav.AV_PIX_FMT_RGBA
        : libav.AV_PIX_FMT_RGB24;

      // And read
      while (true) {
        console.log(
          `------------------------ Frame ${frameCounter} ------------------------`
        );
        console.time("loop");
        // Read some packets
        console.time("ff_read_multi");
        const [res, packets] = await libav.ff_read_multi(fmt_ctx, pkt, null, {
          limit: 1,
        });
        console.timeEnd("ff_read_multi");

        /* And decode them. We decode them one-by-one for stats
         * purposes, but obviously would do several at a time for
         * better performance. */
        const vPackets = packets[videoIdx];
        for (let vIdx = 0; vPackets && vIdx < vPackets.length; vIdx++) {
          const vPacket = vPackets[vIdx];
          if (seeked) break;

          const stat = {
            start: performance.now() / 1000,
            frames: 0,
            pts: 0,
            end: 0,
          };
          stats.push(stat);
          const early = stat.start - 2;
          while (stats[0].start < early) {
            stats.shift();
          }

          let frames;

          // Decode it
          console.time("ff_decode_multi");
          const decodedFrames = await libav.ff_decode_multi(
            codecContextPtr,
            pkt,
            frame,
            [vPacket],
            res === libav.AVERROR_EOF && vIdx === vPackets.length - 1
          );
          console.timeEnd("ff_decode_multi");

          if (techniquePicker.value === "sws_scale_frame") {
            frames = decodedFrames;
          } else {
            console.time("ff_filter_multi");
            frames = await libav.ff_filter_multi(
              buffersrc_ctx,
              buffersink_ctx,
              frame,
              decodedFrames,
              res === libav.AVERROR_EOF && vIdx === vPackets.length - 1
            );
            console.timeEnd("ff_filter_multi");
          }

          // Display any frames here

          for (let frame of frames) {
            frameCounter++;
            const pts = frame.pts;

            if (techniquePicker.value === "sws_scale_frame") {
              // Maybe initialize the scaler
              if (
                inW !== frame.width ||
                inH !== frame.height ||
                inF !== frame.format
              ) {
                if (sctx !== null) await libav.sws_freeContext(sctx);

                inW = frame.width;
                inH = frame.height;
                inF = frame.format;
                sctx = await libav.sws_getContext(
                  inW,
                  inH,
                  inF,
                  width * resolutionMultipler,
                  height * resolutionMultipler,
                  targetPixFormat,
                  2,
                  0,
                  0,
                  0
                );
                // console.log("sws_getContext");
              }

              // Scale
              console.time("ff_copyin_frame");
              await libav.ff_copyin_frame(sinFrame, frame);
              console.timeEnd("ff_copyin_frame");

              console.time("sws_scale_frame");
              await libav.sws_scale_frame(sctx, soutFrame, sinFrame);
              console.timeEnd("sws_scale_frame");
              console.time("ff_copyout_frame");
              frame = await libav.ff_copyout_frame(soutFrame);
              console.timeEnd("ff_copyout_frame");
            }

            // Convert from libav planes to ImageData
            console.time("convert libav planes to ImageData");
            console.time("convert loop");
            {
              let idx = 0;
              const plane = frame.data[0];
              for (const line of plane) {
                id.data.set(line, idx);
                idx += frame.width * 4;
              }
            }
            console.timeEnd("convert loop");
            console.time("id.data.set");
            id.data.set(frame.data[0]);
            console.timeEnd("id.data.set");
            console.timeEnd("convert libav planes to ImageData");

            // Display it
            console.time("createImageBitmap");
            const ib = await createImageBitmap(id);
            console.timeEnd("createImageBitmap");

            console.time("clearRect");
            cctx.clearRect(0, 0, width, height);
            console.timeEnd("clearRect");

            console.time("drawImage");
            cctx.drawImage(ib, 0, 0, width, height);
            console.timeEnd("drawImage");

            // And show it
            const start =
              (pts * videoStream.time_base_num) / videoStream.time_base_den;
            //   durationBox.innerText = `${t.toFixed(2)}/${
            //     videoStream.duration
            //   }`;
            //   console.log(`start = ${start}`);
            seeker.value = start * 10;
          }

          // And figure out stats
          stat.end = performance.now() / 1000;
          stat.frames = frames.length;
          if (frames.length) {
            stat.pts = frames[frames.length - 1].pts;
          } else {
            stats.pop();
          }

          if (stats.length) {
            const first = stats[0];
            const secondLast = stats[stats.length > 1 ? stats.length - 2 : 0];
            const last = stats[stats.length - 1];
            const fps =
              stats.map((x) => x.frames).reduce((x, y) => x + y, 0) /
              (last.end - first.start);

            const frameTime =
              (last.pts * videoStream.time_base_num) /
              videoStream.time_base_den;
            const previousFrameTime =
              (secondLast.pts * videoStream.time_base_num) /
              videoStream.time_base_den;

            const framesPlayed = frameCounter;

            const frameDuration = frameTime - previousFrameTime;
            const timePlayed = frameTime + frameDuration;
            const sourceFPS = framesPlayed / timePlayed;

            // console.log(
            //   `frameTime = ${frameTime.toFixed(
            //     2
            //   )}, previousFrameTime = ${previousFrameTime.toFixed(
            //     2
            //   )}, frameDuration = ${frameDuration.toFixed(
            //     2
            //   )} timePlayed = ${timePlayed.toFixed(
            //     2
            //   )}, framesPlayed = ${framesPlayed.toFixed(
            //     2
            //   )}, sourceFPS = ${sourceFPS.toFixed(2)}`
            // );

            // Duration of track in seconds, frame count
            const xrt =
              ((last.pts - first.pts) * videoStream.time_base_num) /
              videoStream.time_base_den /
              (last.end - first.start);

            statsBox.innerText = `
                  ${width} x ${height} @ ${sourceFPS.toFixed(2)} FPS
                  ${Math.floor(width * resolutionMultipler)} x ${Math.floor(
              height * resolutionMultipler
            )} Playback Resolution
                  ${fps.toFixed(2)} FPS Playback \n${xrt.toFixed(
              2
            )}x Real-time`;
          }
        }

        console.timeEnd("loop");

        if (seeked) {
          seeked = false;
          continue;
        }

        if (res === libav.AVERROR_EOF) {
          // Await seeking elsewhere
          await new Promise((res) => {
            seekerWakeup = res;
          });
        }
      }
    }
  } catch (ex) {
    alert(ex + "");
  }
}
