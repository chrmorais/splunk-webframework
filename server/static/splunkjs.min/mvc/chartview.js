define("util/jscharting_utils",["underscore","helpers/user_agent"],function(e,t){var n=/^[^_]|^_time/,r=50,i=function(){return t.isIE()?t.isIELessThan(9)?500:1200:1500}(),s=t.isIELessThan(9)?2e3:2e4,o=80,u=function(e,t){t=t||{};var n={};t.JSCHART_TEST_MODE&&(n.testMode=!0);var r=e.length>0&&e.fieldAt(0)==="_time"&&(e.hasField("_span")||e.seriesAt(0).length===1);return e.length>0&&!r&&e.seriesAt(0).length>o&&(n["axisLabelsX.hideCategories"]=!0),e.hasField("_tc")&&(n.fieldHideList=["percent"]),n},a=function(t,n){var r={fields:t.fields,columns:[]};return e(t.columns).each(function(e,t){r.columns[t]=e.slice(0,n)}),r},f=function(t){var r=e.isString(t)?t:t.name;return n.test(r)},l=function(t,n){if(t.columns.length===0||t.columns[0].length===0)return t;var o=n.chart||"column";if(o in{pie:!0,scatter:!0,radialGauge:!0,fillerGauge:!0,markerGauge:!0})return t;if(t.fields.length>=r){var u,l=e(t.fields).map(function(t){return e.isString(t)?t:t.name}),c=e(l).indexOf("_span");c>-1&&c>=r&&(u=t.columns[c]),t={columns:t.columns.slice(0,r),fields:t.fields.slice(0,r)},u&&(t.columns.push(u),t.fields.push("_span"))}var h,p=parseInt(n["chart.resultTruncationLimit"],10)||parseInt(n.resultTruncationLimit,10);p>0?h=p:h=o in{line:!0,area:!0}?s:i;var d=e(t.fields).filter(f),v=d.length-1,m=t.columns[0].length,g=Math.floor(h/v);return m>g?a(t,g):t};return{getCustomDisplayProperties:u,preprocessChartData:l}}),define("splunkjs/mvc/chartview",["require","exports","module","underscore","jquery","./mvc","./basesplunkview","./messages","./drilldown","./utils","util/console","splunk.util","splunk.legend","util/jscharting_utils","splunk.config","jquery.ui.resizable","splunk.util","./tokenawaremodel"],function(e,t,n){var r=e("underscore"),i=e("jquery"),s=e("./mvc"),o=e("./basesplunkview"),u=e("./messages"),a=e("./drilldown"),f=e("./utils"),l=e("util/console"),c=e("splunk.util"),h=e("splunk.legend"),p=e("util/jscharting_utils"),d=e("splunk.config"),v=e("jquery.ui.resizable"),m,g=e("splunk.util"),y=e("./tokenawaremodel"),b=o.extend({moduleId:n.id,className:"splunk-chart",chartOptionPrefix:"charting.",options:{height:"250px",data:"preview",type:"column",drilldownRedirect:!0,"charting.drilldown":"all",resizable:!1},omitFromSettings:["el","reportModel","drilldown"],normalizeOptions:function(e,t){t.hasOwnProperty("drilldown")&&!t.hasOwnProperty("charting.drilldown")&&e.set("charting.drilldown",t.drilldown),t.hasOwnProperty("charting.layout.splitSeries")&&e.set("charting.layout.splitSeries",c.normalizeBoolean(t["charting.layout.splitSeries"])?"1":"0"),t.hasOwnProperty("show")&&e.set("show",c.normalizeBoolean(t.show)?"1":"0")},initialize:function(t){this.configure(),this.model=this.options.reportModel||y._createReportModel(),this.settings._sync=f.syncModels(this.settings,this.model,{auto:!0,prefix:"display.visualizations.",exclude:["managerid","id","name","data","type","drilldownRedirect"]}),this.normalizeOptions(this.settings,t),this.maxResultCount=1e3,this.settings.has("charting.data.count")&&!r.isNaN(parseInt(this.settings.get("charting.data.count"),10))&&(this.maxResultCount=parseInt(this.settings.get("charting.data.count"),10)),this._currentHeight=parseInt(this.settings.get("height"),10),this.$chart=i("<div></div>"),this.$msg=i("<div></div>"),this.$inlineMsg=i("<div></div>"),this.settings.on("change",this.render,this);var n=this;e(["js_charting/js_charting"],function(e){m=e,n._chartCreationPending&&n.chartData&&n._createChart(),n.createChart=n._createChart}),this.bindToComponentSetting("managerid",this._onManagerChange,this),h.register(this.cid),this._onResizeMouseup=r.bind(this._onResizeMouseup,this),this.settings.on("change:resizable",function(e,t,n){t?this._enableResize():this._disableResize()},this),this.settings.get("resizable")&&this._enableResize(),this.manager||this._onManagerChange(s.Components,null)},_onManagerChange:function(e,t){this.manager&&(this.manager.off(null,null,this),this.manager=null),this.resultsModel&&(this.resultsModel.off(null,null,this),this.resultsModel=null);if(!t){this.message("no-search");return}this.message("empty"),this._err=!1,this.manager=t,this.resultsModel=this.manager.data(this.settings.get("data"),{autofetch:!0,output_mode:"json_cols",show_metadata:!0,count:this.maxResultCount}),this.resultsModel.on("data",this._onDataChanged,this),this.resultsModel.on("error",this._onSearchError,this),t.on("search:start",this._onSearchStart,this),t.on("search:progress",this._onSearchProgress,this),t.on("search:done",this._onSearchProgress,this),t.on("search:cancelled",this._onSearchCancelled,this),t.on("search:fail",this._onSearchFailed,this),t.on("search:error",this._onSearchError,this),t.replayLastSearchEvent(this)},_onDataChanged:function(){if(!this.resultsModel.hasData()){this._isJobDone&&this.message("no-results");return}var e=this.resultsModel.data();l.log("chart data changed:",e),e.fields.length&&(this.chartData=e,this.updateChart())},_onSearchProgress:function(e){this._err=!1,e=e||{};var t=e.content||{},n=t.resultPreviewCount||0,r=this._isJobDone=t.isDone||!1;if(n===0&&r){this.message("no-results");return}n===0&&this.message("waiting")},_onSearchCancelled:function(){this._isJobDone=!1,this.message("cancelled")},_onSearchError:function(e,t){this._isJobDone=!1,this._err=!0;var n=u.getSearchErrorMessage(t)||e;this.message({level:"error",icon:"warning-sign",message:n})},_onSearchFailed:function(e){this._isJobDone=!1,this._err=!0;var t=u.getSearchFailureMessage(e);this.message({level:"error",icon:"warning-sign",message:t})},_onSearchStart:function(){this._isJobDone=!1,this._err=!1,this.destroyChart(),this.message("waiting")},message:function(e){this.$msg.detach(),u.render(e,this.$msg),this.$msg.prependTo(this.$el),this.trigger("rendered",this)},inlineMessage:function(e){e.compact=!0,u.render(e,this.$inlineMsg),this.trigger("rendered",this)},render:function(){return this.$el.height(this._currentHeight).css("overflow","hidden"),this.$msg.height(this._currentHeight).css("overflow","hidden"),this.$chart.appendTo(this.$el),this.$inlineMsg.appendTo(this.$el),this.chart&&this.destroyChart(),this._boundInvalidateChart||(this._boundInvalidateChart=r.bind(this.invalidateChart,this)),h.removeEventListener("labelIndexMapChanged",this._boundInvalidateChart),h.addEventListener("labelIndexMapChanged",this._boundInvalidateChart),this._debouncedResize||(this._debouncedResize=r.debounce(r.bind(this.resizeChart,this),100)),i(window).off("resize",this._debouncedResize),i(window).on("resize",this._debouncedResize),this.createChart(),this},show:function(){this.$el.css("display","")},hide:function(){this.$el.css("display","none")},createChart:function(){this._chartCreationPending=!0},_enableResize:function(){this._canEnableResize()&&(this.$el.resizable({autoHide:!0,handles:"s",stop:this._onResizeStop.bind(this)}),this.$el.on("mouseup",this._onResizeMouseup))},_disableResize:function(){this._canEnableResize()&&(this.$el.resizable("destroy"),this.$el.off("mouseup",this._onResizeMouseup))},_onResizeMouseup:function(e){i(this).width("100%")},_onResizeStop:function(e,t){i(e.target).width("100%"),this._currentHeight=this.$el.height(),this.resizeChart()},_canEnableResize:function(){return!(i.browser.safari&&i.browser.version<"526")},_createChart:function(){var e={chart:this.settings.get("type")},t=this.chartOptionPrefix;r.each(this.settings.toJSON(),function(n,r){r.substring(0,t.length)==t&&(e[r.substring(t.length)]=n)},this);if(this._err)return;this.$msg.detach(),l.log("Creating chart with data: ",e);var n=this.chart=m.createChart(this.$chart,e);n.on("pointClick",this.emitDrilldownEvent.bind(this)),n.on("legendClick",this.emitDrilldownEvent.bind(this)),this.updateChart()},resizeChart:function(){this.chart&&(this.updateChartContainerHeight(),this.chart.resize())},updateChart:function(){if(this._err)return;l.log("updateChart data=%o this.chart=%o",this.chartData,this.chart);if(this.chartData){if(this.chart){this.$msg.detach(),this.$inlineMsg.empty();var e=p.preprocessChartData(this.chartData,this.chart.getCurrentDisplayProperties()),t=m.extractChartReadyData(e);this.chart.prepare(t,p.getCustomDisplayProperties(t,d)),e.columns.length>0&&(e.columns.length<this.chartData.columns.length||e.columns[0].length<this.chartData.columns[0].length)?this.inlineMessage({level:"warn",message:r("These results may be truncated. Your search generated too much data for the current visualization configuration.").t()}):this.chartData.columns.length>0&&this.maxResultCount>0&&this.chartData.columns[0].length>=this.maxResultCount&&this.inlineMessage({level:"warn",message:c.sprintf(r("These results may be truncated. This visualization is configured to display a maximum of %s results per series, and that limit has been reached.").t(),this.maxResultCount)}),this.updateChartContainerHeight();if(this.chart.requiresExternalColorPalette()){var n=this.chart.getFieldList();h.setLabels(this.cid,n)}this.invalidateChart()}else this.createChart();this.trigger("rendered",this)}},destroyChart:function(){this.chart&&(this.chart.off(),this.chart.destroy(),this.chart=null,clearTimeout(this._redrawChartTimeout))},updateChartContainerHeight:function(){this.$chart.height(this._currentHeight-this.$inlineMsg.outerHeight())},invalidateChart:function(){clearTimeout(this._redrawChartTimeout);if(!this.chart||!this.chartData)return;var e=this;this._redrawChartTimeout=setTimeout(function(){e.chart.requiresExternalColorPalette()&&e.setChartColorPalette();var t=(new Date).getTime();e.chart.draw(),l.DEBUG_ENABLED&&l.log("Chart=%o drawn in duration=%o ms",e.model.get("display.visualizations.charting.chart"),(new Date).getTime()-t),e.trigger("rendered",e)},5)},setChartColorPalette:function(){var e={};r(this.chart.getFieldList()).each(function(t){e[t]=h.getLabelIndex(t)}),this.chart.setExternalColorPalette(e,h.numLabels())},emitDrilldownEvent:function(e){var t={},n=this.manager;e.hasOwnProperty("name")&&r.extend(t,{"click.name":e.name,"click.value":e.value}),e.hasOwnProperty("name2")&&r.extend(t,{"click.name2":e.name2,"click.value2":e.value2}),r.extend(t,e.rowContext);var i,s;if(e.name==="_time"&&e._span){var o=parseFloat(e._span);i=parseInt(e.value,10),s=i+o,r.extend(t,{earliest:i||"",latest:s||""})}else n.job?(i=n.job.properties().searchEarliestTime,s=n.job.properties().searchLatestTime,!i&&n.job.properties().earliestTime&&(i=g.getEpochTimeFromISO(n.job.properties().earliestTime)),!s&&n.job.properties().latestTime&&(s=g.getEpochTimeFromISO(n.job.properties().latestTime)),r.extend(t,{earliest:i||"",latest:s||""})):r.extend(t,{earliest:"",latest:""});var u=!1,a=r.once(r.bind(this.drilldown,this,e)),f=function(){u=!0};this.trigger("drilldown click",{field:e.name2||e.name,data:t,event:e,preventDefault:f,drilldown:a},this),e.preventDefault=f,e.drilldown=a,this.trigger(e.type==="legendClick"?"clicked:legend click:legend":"clicked:chart click:chart",e,this);var l=this.settings.get("charting.drilldown");l!=="none"&&c.normalizeBoolean(l)!==!1&&this.settings.get("drilldownRedirect")&&!u&&a()},drilldown:function(e,t){var n=this.settings.get("charting.drilldown")==="all"?"all":"none";a.handleDrilldown(e,n,this.manager,t)},remove:function(){h.unregister(this.cid),this._boundInvalidateChart&&h.removeEventListener("labelIndexMapChanged",this._boundInvalidateChart),this._debouncedResize&&i(window).off("resize",this._debouncedResize),this.chart&&this.destroyChart(),this.settings&&(this.settings.off(),this.settings._sync&&this.settings._sync.destroy()),o.prototype.remove.call(this)}});return b});