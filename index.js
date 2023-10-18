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
      const { scaledWidth, scaledHeight } = limitPlaybackResolution(
        width,
        height,
        width * resolutionMultipler * height * resolutionMultipler
      );

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
      canvas.width = scaledWidth;
      canvas.height = scaledHeight;
      canvas.style.width = `${canvas.width / devicePixelRatio}px`;
      canvas.style.height = `${canvas.height / devicePixelRatio}px`;
      main.appendChild(canvas);
      const cctx = canvas.getContext("2d");

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

      // const id = cctx.createImageData(
      //   width * resolutionMultipler,
      //   height * resolutionMultipler
      // );

      let buffersrc_ctx, buffersink_ctx;
      if (techniquePicker.value === "format_filter") {
        const [_buffersrc_ctx, _buffersink_ctx] = await init_filters(
          libav,
          width,
          height,
          canvas.width,
          canvas.height,
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
        console.time("total");
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

          // Decode it
          console.time("ff_decode_filter_multi");
          const frames = await libav.ff_decode_filter_multi(
            codecContextPtr,
            buffersrc_ctx,
            buffersink_ctx,
            pkt,
            frame,
            [vPacket],
            {
              fin: res === libav.AVERROR_EOF && vIdx === vPackets.length - 1,
              copyoutFrame: "ImageData",
            }
          );
          console.timeEnd("ff_decode_filter_multi");

          // Display any frames here

          for (let frame of frames) {
            frameCounter++;
            const pts = frame.pts;

            // Display it
            console.time("createImageBitmap");
            const ib = await createImageBitmap(frame);
            console.timeEnd("createImageBitmap");

            console.time("clearRect");
            cctx.clearRect(0, 0, canvas.width, canvas.height);
            console.timeEnd("clearRect");

            console.time("drawImage");
            cctx.drawImage(ib, 0, 0, canvas.width, canvas.height);
            console.timeEnd("drawImage");

            // And show it
            const start =
              (pts * videoStream.time_base_num) / videoStream.time_base_den;
            //   durationBox.innerText = `${t.toFixed(2)}/${
            //     videoStream.duration
            //   }`;
            //   console.log(`start = ${start}`);
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
                  ${Math.floor(canvas.width)} x ${Math.floor(
              canvas.height
            )} Playback Resolution
                  ${fps.toFixed(2)} FPS Playback \n${xrt.toFixed(
              2
            )}x Real-time`;
          }
        }

        console.timeEnd("total");

        if (res === libav.AVERROR_EOF) {
          return;
        }
      }
    }
  } catch (ex) {
    alert(ex + "");
  }
}

function limitPlaybackResolution(width, height, maxPixelCount) {
  const pixelCount = width * height;
  if (pixelCount <= maxPixelCount) {
    return { scaledWidth: width, scaledHeight: height };
  }
  const scale = Math.sqrt(maxPixelCount / pixelCount);
  let scaledWidth = Math.ceil(width * scale);
  let scaledHeight = Math.ceil(height * scale);

  // Also ensure width is a multiple of 16
  if (scaledWidth % 16) {
    const newScaledWidth = Math.ceil(scaledWidth / 16) * 16;
    scaledHeight = Math.ceil(
      scaledHeight * Math.sqrt(newScaledWidth / scaledWidth)
    );
    scaledWidth = newScaledWidth;
  }

  return {
    scaledWidth,
    scaledHeight,
  };
}
