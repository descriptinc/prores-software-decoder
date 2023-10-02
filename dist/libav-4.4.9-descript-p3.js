(function(){function e(e){e=e||[0,97,115,109,1,0,0,0];if(typeof WebAssembly!=="object"||typeof WebAssembly.instantiate!=="function")return false;try{var e=new WebAssembly.Module(new Uint8Array(e));if(e instanceof WebAssembly.Module)return new WebAssembly.Instance(e)instanceof WebAssembly.Instance}catch(e){}return false}function _(){try{var e=new WebAssembly.Memory({initial:1,maximum:1,shared:true});if(!(e.buffer instanceof SharedArrayBuffer))return false;return true}catch(e){}return false}function t(){return e([0,97,115,109,1,0,0,0,1,5,1,96,0,1,123,3,2,1,0,10,10,1,8,0,65,0,253,15,253,98,11])}function r(){try{importScripts("data:,");return false}catch(e){}return true}var c;var s=false;if(typeof LibAV==="undefined")LibAV={};c=LibAV;if(!c.base)c.base=".";c.isWebAssemblySupported=e;c.isThreadingSupported=_;c.isSIMDSupported=t;c.isModule=r;function n(e){return"wasm"}c.target=n;c.VER="4.4.9";c.CONFIG="descript-p3";c.DBG="";c.LibAV=function(e){e=e||{};var _=e.base||c.base;var t=n(e);var a=c.toImport||_+"/libav-4.4.9-descript-p3."+t+".js";var i;var o="direct";if(t.indexOf("thr")===0)o="threads";else if(!s&&!e.noworker&&typeof Worker!=="undefined")o="worker";return Promise.all([]).then(function(){if(!c.LibAVFactory){if(s){c.LibAVFactory=require(a)}else if(o==="worker"){}else if(typeof importScripts!=="undefined"){if(!r()){importScripts(a);c.LibAVFactory=LibAVFactory}else{var e;if(typeof globalThis!=="undefined")e=globalThis;else if(typeof self!=="undefined")e=self;else e=window;c.LibAVFactory=e.LibAVFactory;if(e.LibAVFactory)return e.LibAVFactory;else throw new Error("If in an ES6 module, you need to import "+a+" yourself before loading libav.js.")}}else{return new Promise(function(e,_){var t=document.createElement("script");t.src=a;t.addEventListener("load",e);t.addEventListener("error",_);t.async=true;document.body.appendChild(t)}).then(function(){c.LibAVFactory=LibAVFactory})}}}).then(function(){if(o==="worker"){i={};i.worker=new Worker(a);i.worker.postMessage({config:{wasmurl:c.wasmurl}});return new Promise(function(e,_){i.on=1;i.handlers={onready:[function(){e()},null],onwrite:[function(e){if(i.onwrite)i.onwrite.apply(i,e)},null],onblockread:[function(_){try{var e=null;if(i.onblockread)e=i.onblockread.apply(i,_);if(e&&e.then&&e.catch){e.catch(function(e){i.ff_block_reader_dev_send(_[0],_[1],null,{error:e})})}}catch(e){i.ff_block_reader_dev_send(_[0],_[1],null,{error:e})}},null]};i.c=function(){var a=Array.prototype.slice.call(arguments);return new Promise(function(e,_){var t=i.on++;a=[t].concat(a);i.handlers[t]=[e,_];i.worker.postMessage(a)})};function t(e){var _=e.data[0];var t=i.handlers[_];if(t){if(e.data[2])t[0](e.data[3]);else t[1](e.data[3]);if(typeof _==="number")delete i.handlers[_]}}i.worker.onmessage=t;i.terminate=function(){i.worker.terminate()}})}else if(o==="threads"){return Promise.all([]).then(function(){return c.LibAVFactory()}).then(function(e){i=e;var _=i.libavjs_create_main_thread();var r=i.PThread.pthreads[_];var t=0;var o=1;var c={};var a=null;var s=new Promise(function(e){a=e});i.c=function(){var a=Array.prototype.slice.call(arguments);return new Promise(function(e,_){var t=o++;a=[t].concat(a);c[t]=[e,_];r.postMessage({c:"libavjs_run",a:a})})};var n=r.onmessage;r.onmessage=function(e){if(e.data&&e.data.c==="libavjs_ret"){var _=e.data.a;var t=c[_[0]];if(t){if(_[2])t[0](_[3]);else t[1](_[3]);delete c[_[0]]}}else if(e.data&&e.data.c==="libavjs_wait_reader"){if(i.readerDevReady(e.data.fd)){r.postMessage({c:"libavjs_wait_reader"})}else{i.ff_reader_dev_waiters.push(function(){r.postMessage({c:"libavjs_wait_reader"})})}}else if(e.data&&e.data.c==="libavjs_ready"){a()}else{return n.apply(this,arguments)}};i.terminate=function(){i.PThread.unusedWorkers.concat(i.PThread.runningWorkers).forEach(function(e){e.terminate()})};return s})}else{return Promise.all([]).then(function(){return c.LibAVFactory()}).then(function(e){i=e;i.worker=false;i.c=function(t){var a=Array.prototype.slice.call(arguments,1);return new Promise(function(e,_){try{e(i[t].apply(i,a))}catch(e){_(e)}})};i.terminate=function(){}})}}).then(function(){function e(e){e.forEach(function(e){i[e]=function(){return i.c.apply(i,[e].concat(Array.prototype.slice.call(arguments)))}})}function _(e){e.forEach(function(e){var r=i[e+"_sync"]=i[e];i[e]=function(){var a=arguments;return new Promise(function(e,_){try{var t=r.apply(i,a);if(typeof t==="object"&&t!==null&&t.then)t.then(e).catch(_);else e(t)}catch(e){_(e)}})}})}var t=["av_get_bytes_per_sample","av_compare_ts_js","av_opt_set","av_opt_set_int_list_js","av_frame_alloc","av_frame_free","av_frame_get_buffer","av_frame_make_writable","av_frame_unref","av_packet_alloc","av_packet_free","av_packet_new_side_data","av_packet_rescale_ts_js","av_packet_unref","av_strdup","av_buffersink_get_frame","av_buffersink_set_frame_size","av_buffersrc_add_frame_flags","avfilter_free","avfilter_get_by_name","avfilter_graph_alloc","avfilter_graph_config","avfilter_graph_create_filter_js","avfilter_graph_free","avfilter_graph_parse","avfilter_inout_alloc","avfilter_inout_free","avfilter_link","avcodec_alloc_context3","avcodec_close","avcodec_descriptor_get","avcodec_descriptor_get_by_name","avcodec_descriptor_next","avcodec_find_decoder","avcodec_find_decoder_by_name","avcodec_find_encoder","avcodec_find_encoder_by_name","avcodec_free_context","avcodec_get_name","avcodec_open2","avcodec_open2_js","avcodec_parameters_alloc","avcodec_parameters_copy","avcodec_parameters_free","avcodec_parameters_from_context","avcodec_parameters_to_context","avcodec_receive_frame","avcodec_receive_packet","avcodec_send_frame","avcodec_send_packet","av_find_input_format","avformat_alloc_context","avformat_alloc_output_context2_js","avformat_close_input","avformat_find_stream_info","avformat_free_context","avformat_new_stream","avformat_open_input","avformat_open_input_js","avformat_read_raw_packet_times","avformat_seek_file","avformat_seek_file_min","avformat_seek_file_max","avformat_seek_file_approx","avformat_write_header","avio_open2_js","avio_close","av_find_best_stream","av_get_sample_fmt_name","av_grow_packet","av_interleaved_write_frame","av_packet_make_writable","av_pix_fmt_desc_get","av_read_frame","av_shrink_packet","av_write_frame","av_write_trailer","av_dict_copy_js","av_dict_free","av_dict_set_js","sws_getContext","sws_freeContext","sws_scale_frame","AVFrame_sample_aspect_ratio_num","AVFrame_sample_aspect_ratio_den","AVFrame_sample_aspect_ratio_s","AVCodecContext_framerate_num","AVCodecContext_framerate_den","AVCodecContext_framerate_num_s","AVCodecContext_framerate_den_s","AVCodecContext_framerate_s","AVCodecContext_sample_aspect_ratio_num","AVCodecContext_sample_aspect_ratio_den","AVCodecContext_sample_aspect_ratio_num_s","AVCodecContext_sample_aspect_ratio_den_s","AVCodecContext_sample_aspect_ratio_s","AVCodecContext_time_base_s","AVStream_time_base_num","AVStream_time_base_den","AVStream_time_base_s","AVPacketSideData_data","AVPacketSideData_size","AVPacketSideData_type","AVPixFmtDescriptor_comp_depth","ff_error","ff_nothing","calloc","close","dup2","free","malloc","mallinfo_uordblks","open","strerror","libavjs_with_swscale","libavjs_create_main_thread","ffmpeg_main","ffprobe_main","AVFrame_channel_layout","AVFrame_channel_layout_s","AVFrame_channel_layouthi","AVFrame_channel_layouthi_s","AVFrame_channels","AVFrame_channels_s","AVFrame_channel_layoutmask","AVFrame_channel_layoutmask_s","AVFrame_ch_layout_nb_channels","AVFrame_ch_layout_nb_channels_s","AVFrame_data_a","AVFrame_data_a_s","AVFrame_format","AVFrame_format_s","AVFrame_height","AVFrame_height_s","AVFrame_key_frame","AVFrame_key_frame_s","AVFrame_linesize_a","AVFrame_linesize_a_s","AVFrame_nb_samples","AVFrame_nb_samples_s","AVFrame_pict_type","AVFrame_pict_type_s","AVFrame_pts","AVFrame_pts_s","AVFrame_ptshi","AVFrame_ptshi_s","AVFrame_sample_rate","AVFrame_sample_rate_s","AVFrame_width","AVFrame_width_s","AVPixFmtDescriptor_log2_chroma_h","AVPixFmtDescriptor_log2_chroma_h_s","AVPixFmtDescriptor_log2_chroma_w","AVPixFmtDescriptor_log2_chroma_w_s","AVPixFmtDescriptor_nb_components","AVPixFmtDescriptor_nb_components_s","AVCodec_sample_fmts","AVCodec_sample_fmts_s","AVCodec_sample_fmts_a","AVCodec_sample_fmts_a_s","AVCodec_supported_samplerates","AVCodec_supported_samplerates_s","AVCodec_supported_samplerates_a","AVCodec_supported_samplerates_a_s","AVCodec_type","AVCodec_type_s","AVCodecContext_codec_id","AVCodecContext_codec_id_s","AVCodecContext_codec_type","AVCodecContext_codec_type_s","AVCodecContext_bit_rate","AVCodecContext_bit_rate_s","AVCodecContext_bit_ratehi","AVCodecContext_bit_ratehi_s","AVCodecContext_channel_layout","AVCodecContext_channel_layout_s","AVCodecContext_channel_layouthi","AVCodecContext_channel_layouthi_s","AVCodecContext_channels","AVCodecContext_channels_s","AVCodecContext_channel_layoutmask","AVCodecContext_channel_layoutmask_s","AVCodecContext_ch_layout_nb_channels","AVCodecContext_ch_layout_nb_channels_s","AVCodecContext_extradata","AVCodecContext_extradata_s","AVCodecContext_extradata_size","AVCodecContext_extradata_size_s","AVCodecContext_frame_size","AVCodecContext_frame_size_s","AVCodecContext_gop_size","AVCodecContext_gop_size_s","AVCodecContext_height","AVCodecContext_height_s","AVCodecContext_keyint_min","AVCodecContext_keyint_min_s","AVCodecContext_level","AVCodecContext_level_s","AVCodecContext_max_b_frames","AVCodecContext_max_b_frames_s","AVCodecContext_pix_fmt","AVCodecContext_pix_fmt_s","AVCodecContext_profile","AVCodecContext_profile_s","AVCodecContext_rc_max_rate","AVCodecContext_rc_max_rate_s","AVCodecContext_rc_max_ratehi","AVCodecContext_rc_max_ratehi_s","AVCodecContext_rc_min_rate","AVCodecContext_rc_min_rate_s","AVCodecContext_rc_min_ratehi","AVCodecContext_rc_min_ratehi_s","AVCodecContext_sample_fmt","AVCodecContext_sample_fmt_s","AVCodecContext_sample_rate","AVCodecContext_sample_rate_s","AVCodecContext_qmax","AVCodecContext_qmax_s","AVCodecContext_qmin","AVCodecContext_qmin_s","AVCodecContext_width","AVCodecContext_width_s","AVCodecContext_lowres","AVCodecContext_lowres_s","AVCodecDescriptor_id","AVCodecDescriptor_id_s","AVCodecDescriptor_long_name","AVCodecDescriptor_long_name_s","AVCodecDescriptor_mime_types_a","AVCodecDescriptor_mime_types_a_s","AVCodecDescriptor_name","AVCodecDescriptor_name_s","AVCodecDescriptor_props","AVCodecDescriptor_props_s","AVCodecDescriptor_type","AVCodecDescriptor_type_s","AVCodecParameters_codec_id","AVCodecParameters_codec_id_s","AVCodecParameters_codec_tag","AVCodecParameters_codec_tag_s","AVCodecParameters_codec_type","AVCodecParameters_codec_type_s","AVCodecParameters_extradata","AVCodecParameters_extradata_s","AVCodecParameters_extradata_size","AVCodecParameters_extradata_size_s","AVCodecParameters_format","AVCodecParameters_format_s","AVCodecParameters_bit_rate","AVCodecParameters_bit_rate_s","AVCodecParameters_profile","AVCodecParameters_profile_s","AVCodecParameters_level","AVCodecParameters_level_s","AVCodecParameters_width","AVCodecParameters_width_s","AVCodecParameters_height","AVCodecParameters_height_s","AVCodecParameters_color_range","AVCodecParameters_color_range_s","AVCodecParameters_color_primaries","AVCodecParameters_color_primaries_s","AVCodecParameters_color_trc","AVCodecParameters_color_trc_s","AVCodecParameters_color_space","AVCodecParameters_color_space_s","AVCodecParameters_chroma_location","AVCodecParameters_chroma_location_s","AVCodecParameters_channels","AVCodecParameters_channels_s","AVCodecParameters_channel_layoutmask","AVCodecParameters_channel_layoutmask_s","AVCodecParameters_ch_layout_nb_channels","AVCodecParameters_ch_layout_nb_channels_s","AVCodecParameters_sample_rate","AVCodecParameters_sample_rate_s","AVPacket_pos","AVPacket_pos_s","AVPacket_poshi","AVPacket_poshi_s","AVPacket_pts","AVPacket_pts_s","AVPacket_ptshi","AVPacket_ptshi_s","AVPacket_dts","AVPacket_dts_s","AVPacket_dtshi","AVPacket_dtshi_s","AVPacket_data","AVPacket_data_s","AVPacket_size","AVPacket_size_s","AVPacket_stream_index","AVPacket_stream_index_s","AVPacket_flags","AVPacket_flags_s","AVPacket_side_data","AVPacket_side_data_s","AVPacket_side_data_elems","AVPacket_side_data_elems_s","AVPacket_duration","AVPacket_duration_s","AVPacket_durationhi","AVPacket_durationhi_s","AVFormatContext_nb_streams","AVFormatContext_nb_streams_s","AVFormatContext_oformat","AVFormatContext_oformat_s","AVFormatContext_pb","AVFormatContext_pb_s","AVFormatContext_streams_a","AVFormatContext_streams_a_s","AVStream_codecpar","AVStream_codecpar_s","AVStream_discard","AVStream_discard_s","AVStream_duration","AVStream_duration_s","AVStream_durationhi","AVStream_durationhi_s","AVFilterInOut_filter_ctx","AVFilterInOut_filter_ctx_s","AVFilterInOut_name","AVFilterInOut_name_s","AVFilterInOut_next","AVFilterInOut_next_s","AVFilterInOut_pad_idx","AVFilterInOut_pad_idx_s","ff_reader_dev_send","ff_block_reader_dev_send","ff_reader_dev_waiting","ff_init_encoder","ff_init_decoder","ff_free_encoder","ff_free_decoder","ff_encode_multi","ff_decode_multi","ff_set_packet","ff_init_muxer","ff_free_muxer","ff_init_demuxer_file","ff_write_multi","ff_read_multi","ff_init_filter_graph","ff_filter_multi","ff_copyout_frame","ff_copyin_frame","ff_copyout_packet","ff_copyin_packet","ff_malloc_int32_list","ff_malloc_int64_list","ffmpeg","ffprobe","av_frame_free_js","av_packet_free_js","avformat_close_input_js","avcodec_free_context_js","avcodec_parameters_free_js","avfilter_graph_free_js","avfilter_inout_free_js","av_dict_free_js"];var a=["readFile","writeFile","unlink","mkdev","createLazyFile","mkreaderdev","mkblockreaderdev","mkreadaheadfile","unlinkreadaheadfile","mkwriterdev","mkstreamwriterdev","mkworkerfsfile","unlinkworkerfsfile","copyin_u8","copyout_u8","copyin_s16","copyout_s16","copyin_s32","copyout_s32","copyin_f32","copyout_f32"];i.libavjsMode=o;if(o==="worker"){e(t);e(a)}else if(o==="threads"){e(t);_(a)}else{_(t);_(a)}function r(e,_){if(typeof _===undefined)_=0;var t=_;e.forEach(function(e){i[e]=t++})}i.AV_OPT_SEARCH_CHILDREN=1;r(["AVMEDIA_TYPE_UNKNOWN","AVMEDIA_TYPE_VIDEO","AVMEDIA_TYPE_AUDIO","AVMEDIA_TYPE_DATA","AVMEDIA_TYPE_SUBTITLE","AVMEDIA_TYPE_ATTACHMENT"],-1);r(["AV_SAMPLE_FMT_NONE","AV_SAMPLE_FMT_U8","AV_SAMPLE_FMT_S16","AV_SAMPLE_FMT_S32","AV_SAMPLE_FMT_FLT","AV_SAMPLE_FMT_DBL","AV_SAMPLE_FMT_U8P","AV_SAMPLE_FMT_S16P","AV_SAMPLE_FMT_S32P","AV_SAMPLE_FMT_FLTP","AV_SAMPLE_FMT_DBLP","AV_SAMPLE_FMT_S64","AV_SAMPLE_FMT_S64P","AV_SAMPLE_FMT_NB"],-1);r(["AV_PIX_FMT_NONE","AV_PIX_FMT_YUV420P","AV_PIX_FMT_YUYV422","AV_PIX_FMT_RGB24","AV_PIX_FMT_BGR24","AV_PIX_FMT_YUV422P","AV_PIX_FMT_YUV444P","AV_PIX_FMT_YUV410P","AV_PIX_FMT_YUV411P","AV_PIX_FMT_GRAY8","AV_PIX_FMT_MONOWHITE","AV_PIX_FMT_MONOBLACK","AV_PIX_FMT_PAL8","AV_PIX_FMT_YUVJ420P","AV_PIX_FMT_YUVJ422P","AV_PIX_FMT_YUVJ444P","AV_PIX_FMT_UYVY422","AV_PIX_FMT_UYYVYY411","AV_PIX_FMT_BGR8","AV_PIX_FMT_BGR4","AV_PIX_FMT_BGR4_BYTE","AV_PIX_FMT_RGB8","AV_PIX_FMT_RGB4","AV_PIX_FMT_RGB4_BYTE","AV_PIX_FMT_NV12","AV_PIX_FMT_NV21","AV_PIX_FMT_ARGB","AV_PIX_FMT_RGBA","AV_PIX_FMT_ABGR","AV_PIX_FMT_BGRA","AV_PIX_FMT_GRAY16BE","AV_PIX_FMT_GRAY16LE","AV_PIX_FMT_YUV440P","AV_PIX_FMT_YUVJ440P","AV_PIX_FMT_YUVA420P","AV_PIX_FMT_RGB48BE","AV_PIX_FMT_RGB48LE","AV_PIX_FMT_RGB565BE","AV_PIX_FMT_RGB565LE","AV_PIX_FMT_RGB555BE","AV_PIX_FMT_RGB555LE","AV_PIX_FMT_BGR565BE","AV_PIX_FMT_BGR565LE","AV_PIX_FMT_BGR555BE","AV_PIX_FMT_BGR555LE"],-1);i.AVIO_FLAG_READ=1;i.AVIO_FLAG_WRITE=2;i.AVIO_FLAG_READ_WRITE=3;i.AVIO_FLAG_NONBLOCK=8;i.AVIO_FLAG_DIRECT=32768;i.AVSEEK_FLAG_BACKWARD=1;i.AVSEEK_FLAG_BYTE=2;i.AVSEEK_FLAG_ANY=4;i.AVSEEK_FLAG_FRAME=8;i.AVDISCARD_NONE=-16;i.AVDISCARD_DEFAULT=0;i.AVDISCARD_NONREF=8;i.AVDISCARD_BIDIR=16;i.AVDISCARD_NONINTRA=24;i.AVDISCARD_NONKEY=32;i.AVDISCARD_ALL=48;r(["E2BIG","EPERM","EADDRINUSE","EADDRNOTAVAIL","EAFNOSUPPORT","EAGAIN","EALREADY","EBADF","EBADMSG","EBUSY","ECANCELED","ECHILD","ECONNABORTED","ECONNREFUSED","ECONNRESET","EDEADLOCK","EDESTADDRREQ","EDOM","EDQUOT","EEXIST","EFAULT","EFBIG","EHOSTUNREACH","EIDRM","EILSEQ","EINPROGRESS","EINTR","EINVAL","EIO","EISCONN","EISDIR","ELOOP","EMFILE","EMLINK","EMSGSIZE","EMULTIHOP","ENAMETOOLONG","ENETDOWN","ENETRESET","ENETUNREACH","ENFILE","ENOBUFS","ENODEV","ENOENT"],1);i.AVERROR_EOF=-541478725;return i})};if(s)module.exports=c})();
