/**
	Microflow Timer
	========================

	@file      : DynamicImage.js
	@author    : Michel Weststrate
	@date      : 7-4-2010
	@copyright : Mendix
	@license   : Please contact our sales department.

	Documentation
	=============
	The microflow timer can be used to execute a microflow on a regular, timed basis. 

*/
define([
	'dojo/_base/declare',
	'mxui/widget/_WidgetBase',
	'dojo/_base/lang'
], function (declare, _WidgetBase, lang) {
	'use strict';

	return declare('MicroflowTimer.widget.MicroflowTimer', [ _WidgetBase ], {
	//DECLARATION
	inputargs: { 
		interval : 3000,
		once  : false,
        startatonce : true,
		microflow : ''
	},
	
	dataobject : null,
	handle : null,
	stopped : false,
	blocked : false,
	
  // updates the image with a new dataobject 
	setDataobject : function(dataobject) {
		logger.debug(this.id + ".setDataobject");
		this.dataobject = dataobject;
		
		if (this.dataobject != null)
		{
			this.stop(); //stop old intervals
			this.stopped = false;
			this.start();
		}
	},
	
	start : function() {
        this.addOnLoad(lang.hitch(this, function() { //make sure the thing only starts when completely loaded!
            if (this.once)
                this.handle = window.setTimeout(lang.hitch(this, function() {
                    this.execute();
                    this.stopped = true;
                }), this.interval);
            else {
                if (this.startatonce)
                    this.execute(); //invoke directly as well
                this.handle = window.setInterval(lang.hitch(this, this.execute), this.interval);
            }
        }));
	},
	
	stop : function() {
		if (this.handle != null)
			window.clearInterval(this.handle);
		this.blocked = false;
	},
	
	suspended : function() {
		this.stop();
	},
	
	resumed : function() {
		this.start();
	},
	
	execute : function() {
		if (this.dataobject != null && this.dataobject.getGuid && this.dataobject.getGuid())
		{
			//microflow set, not already calling a microflow
			if (this.microflow != '' && this.blocked == false)
			{
				this.blocked = true;
				mx.data.action({
					params: {
						actionname: this.microflow,
						applyto: 'selection',
						caller: this,
						guids: [ this.dataobject.getGuid() ]
					},
					error: function () {
						logger.error(this.id + "error: XAS error executing microflow");
						//note: error does not set blocked to false: microflows should not throw errors
					},
					callback: lang.hitch(this, function (data) {
						var result = !!data;
						if (result === false) { //received false, stop the stuff
							this.stopped = true;
							this.stop();
						}
						this.blocked = false;
					})
				});
			}			
		}
	},
	
	postCreate : function(){
		logger.debug(this.id + ".postCreate");
		// this.offerInterfaces(["close"]);
		// this.initContext();
		// this.actRendered();
		// Deprecated functions
	},
	
	applyContext : function(context, callback){
		logger.debug(this.id + ".applyContext"); 
		if (context) 
		mx.data.get({
			guid: context.trackObject._guid,
			callback: lang.hitch(this, this.setDataobject)
		});
		else
			logger.warn(this.id + ".applyContext received empty context");
		callback && callback();
	},

	close : function() { 
		this.disposeContent(); 
	},
	
	uninitialize : function(){
		this.stop();
	}
	});
	});

require([ 'MicroflowTimer/widget/MicroflowTimer' ]);
