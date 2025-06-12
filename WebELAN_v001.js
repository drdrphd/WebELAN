/*!
 * WebELAN
 * Version: 0.0.1
 * Author: dr²
 * AI Code assistant: ChatGPT
 * License: fully open, no rights reserved, use at your own risk
 * Description: A library of functions for handling ELAN files within a browser
 * 				ELAN is a time-aligned transcription platform for linguistic transcription
 *				Much hard work has been put into it by the people at the Max Planck Institute
 *				https://archive.mpi.nl/tla/elan
 *				WebELAN is unrelated to & independent from their efforts
 */


//Constructor
function WebELAN() {
	this.elan_file = {};	//this will contain the parsed XML
	this.filename = "";
};



/****************************************/
/* Functions for creating and exporting */
/****************************************/


// //Create a new ELAN file
// WebELAN.prototype.createNewELAN = function() {
// };


//
// loadEAF(file)
//
// Takes an .eaf file from the browser (file)
// Parses the XML, stores it internally, and returns a (Promise)
//
WebELAN.prototype.loadEAF = function(file) {
	var self = this;  //to use in the Promise scope below
	return new Promise(function(resolve, reject) {
		var reader = new FileReader();
		var parser = new DOMParser();
		reader.onload = function(e) {
			var xml_doc = e.target.result;
			self.elan_file = parser.parseFromString(xml_doc, "text/xml");
			resolve(); // ***success feedback here***
			//reject(); // ***error codes***
		};
		reader.readAsText(file);
		self.filename = file.name;
	});
}


//
// exportEAF()
//
// Export an ELAN XML to .eaf
// Creates a blob, initiates download of the blob
//
WebELAN.prototype.exportEAF = function(filename) {
	
	if (filename === undefined) {
		if (this.filename.substring(this.filename.length-4, this.filename.length) == ".eaf") { //if filename ends in .eaf ...
			filename = (this.filename.substring(0, this.filename.length-4) + " (copy)" + ".eaf"); //insert " (copy)" into the filename before the extension (no overwriting, please)
		} else {
			filename = this.filename + " (copy)" + ".eaf"; //add " (copy)" to the filename (no overwriting, please) and add .eaf extension
		}
	}
	
	var xmlString = new XMLSerializer().serializeToString(this.elan_file);
	var blob = new Blob([xmlString], {type: 'application/xml;charset=utf-8;'});
	var url = URL.createObjectURL(blob);
	var download_link = document.createElement('a');
	download_link.href = url;
	download_link.setAttribute('download', filename);
	download_link.click();
}



/***************************************/
/* Functions for retrieving properties */
/***************************************/

//
// times()
//
// Returns an XML object of times {XML, XML, ...}
//
WebELAN.prototype.times = function() {
	return this.elan_file.getElementsByTagName("TIME_SLOT"); //if none, then null
}

//
// tiers()
//
// Returns an XML object of times {XML, XML, ...}
//
WebELAN.prototype.tiers = function() {
	return this.elan_file.getElementsByTagName("TIER"); //if none, then null
}

//
// annotations(), annotations(tier)
//
// Returns an XML object of annotations {XML, XML, ...}
//
WebELAN.prototype.annotations = function(tier) {
	if (tier !== undefined) {
		return tier.getElementsByTagName("ANNOTATION"); //if none, then null
	}
	return this.elan_file.getElementsByTagName("ANNOTATION"); //if none, then null
}



//
// getAnnotationStartTime(XML)
//
// Takes an annotation (XML object)
// Return annotation start time (TIME_SLOT_REF1) as a String
//
WebELAN.prototype.getAnnotationStartTime = function(annotation) {
	var time = "";
	
	//if it's an alignable transcription, just get the time
	var alignables = annotation.getElementsByTagName("ALIGNABLE_ANNOTATION");
	if (alignables.length > 0) {
		time = alignables[0].getAttribute("TIME_SLOT_REF1");
		return time;
	}
	
	//otherwise, get the parent annotation's time (or its parent, or ...)
	var refs = annotation.getElementsByTagName("REF_ANNOTATION");
	if (refs.length > 0) {
		var ID = refs[0].getAttribute("ANNOTATION_REF");
		var annotation = this.getAnnotationByID(ID);
		time = this.getAnnotationStartTime(annotation);	//recursive call (might be a few layers deep)
		return time;
	}
}


//
// getAnnotationEndTime(XML)
//
// Takes an annotation (XML object)
// Return annotation end time (TIME_SLOT_REF2) as a String
//
WebELAN.prototype.getAnnotationEndTime = function(annotation) {
	var time = "";
	
	//if it's an alignable transcription, just get the time
	var alignables = annotation.getElementsByTagName("ALIGNABLE_ANNOTATION");
	if (alignables.length > 0) {
		time = alignables[0].getAttribute("TIME_SLOT_REF2");
		return time;
	}
	
	//otherwise, get the parent annotation's time (or its parent, or ...)
	var refs = annotation.getElementsByTagName("REF_ANNOTATION");
	if (refs.length > 0) {
		var ID = refs[0].getAttribute("ANNOTATION_REF");
		var annotation = this.getAnnotationByID(ID);
		time = this.getAnnotationStartTime(annotation);	//recursive call (might be a few layers deep)
		return time;
	}
}


//
// getAnnotationByID(string)
//
// Takes a reference to another annotation (string)
// Return an annotation (XML)
//
WebELAN.prototype.getAnnotationByID = function(ref) {
	annotations = this.elan_file.getElementsByTagName("ANNOTATION");	//if none, then null
	for (var i = 0; i < annotations.length; i++) {
		if (annotations[i].children[0].getAttribute("ANNOTATION_ID") == ref) {
			return annotations[i];
		}
	}
}
	

//
// getChildTiers(XML, XML)
//
// Takes an ELAN object (XML) and a tier (XML)
// Returns an array of tiers [XML, XML, ...]
//
WebELAN.prototype.getChildTiers = function(tier) {
	const tiers = this.elan_file.getElementsByTagName("TIER");
	var child_tiers = [];
	
	for (var i = 0; i < tiers.length; i++) {
		if (tiers[i].getAttribute("PARENT_REF") == tier.getAttribute("TIER_ID")) {
			child_tiers.push(tiers[i]);
		}
	}
	return child_tiers;
}

//
// msToMinSec(int)
//
// Converts milliseconds to Minute:Second (mm:ss) display times
// taken from: https://stackoverflow.com/questions/21294302/converting-milliseconds-to-minutes-and-seconds-with-javascript
//
function msToMinSec(ms) {
		var minutes = Math.floor(ms / 60000);
		var seconds = ((ms % 60000) / 1000).toFixed(0);
		return (seconds == 60 ? (minutes+1) + ":00" : minutes + ":" + (seconds < 10 ? "0" : "") + seconds);
	}
