async function fetchFile(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Network response was not ok " + response.statusText);
  }
  const blob = await response.blob();
  return blob;
}

async function initDecoder(libav, name, codecpar) {
  var codec, ret;
  if (typeof name === "string") {
    codec = await libav.avcodec_find_decoder_by_name(name);
  } else {
    codec = await libav.avcodec_find_decoder(name);
  }
  if (codec === 0) {
    throw new Error("Codec not found");
  }

  var c = await libav.avcodec_alloc_context3(codec);
  if (c === 0) {
    throw new Error("Could not allocate audio codec context");
  }

  // await libav.AVCodecContext_lowres_s(c, 1);

  var codecid = await libav.AVCodecContext_codec_id(c);

  if (codecpar) {
    ret = await libav.avcodec_parameters_to_context(c, codecpar);
    if (ret < 0)
      throw new Error(
        "Could not set codec parameters: " + (await libav.ff_error(ret))
      );
  }
  // if it is not set, use the copy.
  if ((await libav.AVCodecContext_codec_id(c)) === 0)
    await libav.AVCodecContext_codec_id_s(c, codecid);

  ret = await libav.avcodec_open2(c, codec, 0);
  if (ret < 0)
    throw new Error("Could not open codec: " + (await libav.ff_error(ret)));

  var pkt = await libav.av_packet_alloc();
  if (pkt === 0) throw new Error("Could not allocate packet");

  var frame = await libav.av_frame_alloc();
  if (frame === 0) throw new Error("Could not allocate frame");

  return [codec, c, pkt, frame];
}

async function initLibAV() {
  const version = "4.5.6.8";
  const variant = "descript-p3";
  // Load libav.js
  LibAV = { base: "./dist" };
  await new Promise((res) => {
    const scr = dce("script");
    scr.src = `./dist/libav-${version}-${variant}.js?${Math.random()}`;
    scr.onload = res;
    scr.onerror = () => {
      alert("Failed to load variant!");
    };
    document.body.appendChild(scr);
  });
  const libav = await LibAV.LibAV();
  return libav;
}

const createElement = document.createElement.bind(document);
function dce(arg) {
  return createElement(arg);
}

// Define an asynchronous function to initialize filters using the libav library.
async function init_filters(
  libav,
  sourceWidth,
  sourceHeight,
  outputWidth,
  outputHeight,
  pix_fmt,
  time_base
) {
  // Set the description for the filter graph. In this case, it's a format filter to convert frames to RGB24.
  // const filters_descr = `scale=${outputWidth}:${outputHeight},format=rgba`;
  const filters_descr = `scale=${outputWidth}:${outputHeight},format=rgba`;

  // Get the buffer source filter from the libav library, which will be used to feed frames into the filter graph.
  const buffersrc = await libav.avfilter_get_by_name("buffer");

  // Get the buffer sink filter from the libav library, which will be used to extract frames from the filter graph.
  const buffersink = await libav.avfilter_get_by_name("buffersink");

  // Allocate an AVFilterInOut structure for outputs, which will hold the linked list of input pads.
  const outputs = await libav.avfilter_inout_alloc();

  // Allocate an AVFilterInOut structure for inputs, which will hold the linked list of output pads.
  const inputs = await libav.avfilter_inout_alloc();

  // Allocate a filter graph using libav.
  const filter_graph = await libav.avfilter_graph_alloc();

  // Check if any of the crucial structures failed to allocate and throw an error if so.
  if (!outputs || !inputs || !filter_graph) {
    throw new Error();
  }

  // Create a buffer source context in the filter graph.
  const description = `video_size=${sourceWidth}x${sourceHeight}:pix_fmt=${pix_fmt}:time_base=${time_base}`;
  console.log(description);
  const buffersrc_ctx = await libav.avfilter_graph_create_filter_js(
    buffersrc,
    "in",
    description,
    null,
    filter_graph
  );

  // Create a buffer sink context in the filter graph. No specific options are set here.
  const buffersink_ctx = await libav.avfilter_graph_create_filter_js(
    buffersink,
    "out",
    null,
    null,
    filter_graph
  );

  // Duplicate the strings "in" and "out" for use in setting up the AVFilterInOut structures.
  const strdupIn = await libav.av_strdup("in");
  const strdupOut = await libav.av_strdup("out");

  // Check for failures in creating the buffer contexts or duplicating strings and throw errors if necessary.
  if (buffersrc_ctx === 0) throw new Error("Cannot create video buffer source");
  if (buffersink_ctx === 0) throw new Error("Cannot create video buffer sink");
  if (strdupIn === 0 || strdupOut === 0) throw new Error("Failed to strdup");

  // // Attempt to set the pixel format on the buffer sink context, though this seems misplaced as the format should be set by the format filter.
  // const format = await libav.av_opt_set(
  //   buffersink_ctx,
  //   "format",
  //   "rgb24",
  //   libav.AV_OPT_SEARCH_CHILDREN
  // );

  // Set the name and filter context for the outputs AVFilterInOut structure.
  await libav.AVFilterInOut_name_s(outputs, strdupIn);
  await libav.AVFilterInOut_filter_ctx_s(outputs, buffersrc_ctx);
  await libav.AVFilterInOut_pad_idx_s(outputs, 0);
  await libav.AVFilterInOut_next_s(outputs, 0);

  await libav.AVFilterInOut_name_s(inputs, strdupOut);
  await libav.AVFilterInOut_filter_ctx_s(inputs, buffersink_ctx);
  await libav.AVFilterInOut_pad_idx_s(inputs, 0);
  await libav.AVFilterInOut_next_s(inputs, 0);

  // Parse the filter graph based on the filter description string.
  const parseResult = await libav.avfilter_graph_parse(
    filter_graph,
    filters_descr,
    inputs,
    outputs,
    0
  );

  // Check for failure in parsing the filter graph and throw an error if necessary.
  if (parseResult < 0) {
    throw new Error("Failed to initialize filters");
  }

  // Configure the filter graph.
  const graphConfigResult = await libav.avfilter_graph_config(filter_graph, 0);

  // Check for failure in configuring the filter graph and throw an error if necessary.
  if (graphConfigResult < 0) {
    throw new Error("Failed to configure filtergraph");
  }

  // Return the buffer source and sink contexts for further use.
  return [buffersrc_ctx, buffersink_ctx];
}
