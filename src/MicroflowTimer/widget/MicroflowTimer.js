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
dojo.provide("MicroflowTimer.widget.MicroflowTimer");

mendix.widget.declare("MicroflowTimer.widget.MicroflowTimer", {
	//DECLARATION
	addons       : [mendix.addon._Contextable, mendix.addon._Scriptable],
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
        this.addOnLoad(dojo.hitch(this, function() { //make sure the thing only starts when completely loaded!
            if (this.once)
                this.handle = window.setTimeout(dojo.hitch(this, function() {
                    this.execute();
                    this.stopped = true;
                }), this.interval);
            else {
                if (this.startatonce)
                    this.execute(); //invoke directly as well
                this.handle = window.setInterval(dojo.hitch(this, this.execute), this.interval);
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
		if (this.dataobject != null && this.dataobject.getGUID && this.dataobject.getGUID())
		{
			//microflow set, not already calling a microflow
			if (this.microflow != '' && this.blocked == false)
			{
				this.blocked = true;
				mx.processor.xasAction({
					error       : function() {
						logger.error(this.id + "error: XAS error executing microflow");
						//note: error does not set blocked to false: microflows should not throw errors
					},
					callback    : dojo.hitch(this, function(data) {
						var result = !!data;
						if (result === false) { //received false, stop the stuff
							this.stopped = true;
							this.stop();
						}
						this.blocked = false;
					}),
					actionname  : this.microflow,
					applyto     : 'selection',
					caller : this,
					guids       : [this.dataobject.getGUID()]
				});
			}			
		}
	},
	
	postCreate : function(){
		logger.debug(this.id + ".postCreate");
		this.offerInterfaces(["close"]);
		this.initContext();
		this.actRendered();
	},
	
	applyContext : function(context, callback){
		logger.debug(this.id + ".applyContext"); 
		if (context) 
			mx.processor.getObject(context.getActiveGUID(), dojo.hitch(this, this.setDataobject));
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