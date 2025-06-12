/*!
 * WebELAN
 * Version: 0.0.1
 * AI coding assistant: ChatGPT
 * License: fully open, no rights reserved, use at your own risk
 * Description: A library of functions for handling ELAN files within a browser
 * 				ELAN is a time-aligned transcription platform for linguistic transcription
 *				Much hard work has been put into it by the people at the Max Planck Institute
 *				https://archive.mpi.nl/tla/elan
 *				WebELAN is unrelated to & independent from their efforts
 */


/****************/
/* Constructors */
/****************/

function WebELAN() {
	this.elan_file = {};	//this will contain the parsed XML
	this.filename = "";
}


function Annotation(elan, annotationXML) {
	this.elan = elan;
	this.annotationXML = annotationXML;
	this.ID            = this.elan.getID(this.annotationXML);
	this.name          = this.ID;
	this.startTimeID   = this.elan.getStartTimeID(this);
	this.endTimeID     = this.elan.getEndTimeID(this);
	this.start         = this.elan.getTime(this.startTimeID);
	this.end           = this.elan.getTime(this.endTimeID);
	this.value         = this.annotationXML.children[0].children[0].textContent;
	this.alignable     = ("ALIGNABLE_ANNOTATION" == this.annotationXML.children[0].tagName); //boolean
}


function Tier(elan, tierXML) {
	this.elan = elan;
	this.tierXML       = tierXML;
	this.ID            = this.elan.getID(this.tierXML);
	this.name          = this.ID;
	this.annotations   = this.elan.annotations(this.tierXML);
}



/****************************************/
/* Functions for creating and exporting */
/****************************************/


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
// Returns an array of Tier objects
//
WebELAN.prototype.tiers = function() {
	var tierElements = this.elan_file.getElementsByTagName("TIER"); //if none, then null
	var tiers = [];
	for (var i = 0; i < tierElements.length; i++) {
		var tier = new Tier(this, tierElements[i]);
		tiers.push(tier);
	}
	return tiers;
}

//
// annotations(), annotations(tier)
//
// Returns an array of Annotation objects
//
WebELAN.prototype.annotations = function(tierXML) {
	var annotationElements = [];
	var annotations = [];
	if (tierXML !== undefined) {
		annotationElements = tierXML.getElementsByTagName("ANNOTATION"); //if none, then null
	} else {
		annotationElements = this.elan_file.getElementsByTagName("ANNOTATION"); //if none, then null
	}
	for (var i = 0; i < annotationElements.length; i++) {
		var annotation = new Annotation(this, annotationElements[i]);
		annotations.push(annotation);
	}
	return annotations;
}


//
// getID(...)
// 
// Returns the text of any attribute that ands in "_ID"
WebELAN.prototype.getID = function(item) {
	var attribute_array = item.getAttributeNames();
	for (var i = 0; i < attribute_array.length; i++) {
		if ("_ID" == attribute_array[i].substring(attribute_array[i].length-3, attribute_array[i].length)) {
			return item.getAttribute(attribute_array[i]);
		}
	}
}


//
// getTime(string)
//
// Takes a TIME_SLOT_ID (string)
// Returns a time (string) in miliseconds
//
WebELAN.prototype.getTime = function(time) {
	times = this.times();
	for (var i = 0; i < times.length; i++) {
		if (time == times[i].getAttribute("TIME_SLOT_ID")) {
			return times[i].getAttribute("TIME_VALUE");
		}
	}
}


//
// getMaxTime()
//
// Finds the maximum time among all TIME_SLOT elements
// Returns a time (string) in miliseconds
//
WebELAN.prototype.getMaxTime = function() {
	times = this.times();
	max_time = 0;
	for (var i = 0; i < times.length; i++) {
		if (max_time < times[i].getAttribute("TIME_VALUE")) {
			max_time = times[i].getAttribute("TIME_VALUE");
		}
	}
	return max_time;
}


//
// getStartTimeID(Annotation)
//
// Takes an Annotation object
// Return annotation start time ID (TIME_SLOT_REF1) as a String
//
WebELAN.prototype.getStartTimeID = function(annotation) {
	var time = "";
	
	//if it's an alignable transcription, just get the time
	var alignables = annotation.annotationXML.getElementsByTagName("ALIGNABLE_ANNOTATION");
	if (alignables.length > 0) {
		time = alignables[0].getAttribute("TIME_SLOT_REF1");
		return time;
	}
	
	//otherwise, get the parent annotation's time (or its parent, or ...)
	var refs = annotation.annotationXML.getElementsByTagName("REF_ANNOTATION");
	if (refs.length > 0) {
		var ID = refs[0].getAttribute("ANNOTATION_REF");
		var annotation = this.getAnnotationByID(ID);
		time = this.getStartTimeID(annotation);	//recursive call (might be a few layers deep)
		return time;
	}
}


//
// getEndTimeID(Annotation)
//
// Takes an Annotation object
// Returns Annotation end time ID (TIME_SLOT_REF2) as a String
//
WebELAN.prototype.getEndTimeID = function(annotation) {
	var time = "";
	
	//if it's an alignable transcription, just get the time
	var alignables = annotation.annotationXML.getElementsByTagName("ALIGNABLE_ANNOTATION");
	if (alignables.length > 0) {
		time = alignables[0].getAttribute("TIME_SLOT_REF2");
		return time;
	}
	
	//otherwise, get the parent annotation's time (or its parent, or ...)
	var refs = annotation.annotationXML.getElementsByTagName("REF_ANNOTATION");
	if (refs.length > 0) {
		var ID = refs[0].getAttribute("ANNOTATION_REF");
		var annotation = this.getAnnotationByID(ID);
		time = this.getEndTimeID(annotation);	//recursive call (might be a few layers deep)
		return time;
	}
}


//
// getAnnotationByID(string)
//
// Takes a reference to another annotation (string)
// Return an Annotation object
//
WebELAN.prototype.getAnnotationByID = function(ref) {
	annotationElements = this.elan_file.getElementsByTagName("ANNOTATION");	//if none, then null
	for (var i = 0; i < annotationElements.length; i++) {
		if (ref == annotationElements[i].children[0].getAttribute("ANNOTATION_ID")) {
			var annotation = new Annotation(this, annotationElements[i]);
			return annotation;
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