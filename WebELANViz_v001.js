/*!
 * WebELANViz
 * Version: 0.0.1
 * Author: dr²
 * AI coding assistant: ChatGPT
 * License: fully open, no rights reserved, use at your own risk
 * Description: A library of functions for viewing ELAN files and working with Audio in browser
 * 				ELAN is a time-aligned transcription platform for linguistic transcription
 *				Much hard work has been put into it by the people at the Max Planck Institute
 *				https://archive.mpi.nl/tla/elan
 *				WebELAN is unrelated to & independent from their efforts
 */


//Constructor
function WebELANViz() {
	this.analyzer = {};
	this.audio = {};
	this.spectrogram = {};
	this.waveform = {};
	//store reference to div?
};


// Change Zoom (move later)
WebELANViz.prototype.changeZoom = function(zoom) {
	var r = document.querySelector(':root');
	r.style.setProperty('--hzoom', zoom);
}
WebELANViz.prototype.zoomIn = function(ratio) {
	if (ratio === null) ratio = 1.15;
	var r = document.querySelector(':root');
	var zoom = getComputedStyle(r).getPropertyValue('--hzoom');
	zoom = zoom * ratio;
	r.style.setProperty('--hzoom', zoom);
}
WebELANViz.prototype.zoomOut = function(ratio) {
	if (ratio === null) ratio = 1.15;
	var r = document.querySelector(':root');
	var zoom = getComputedStyle(r).getPropertyValue('--hzoom');
	zoom = zoom / ratio;
	r.style.setProperty('--hzoom', zoom);
}
	


/*******************/
/* Audio Functions */
/*******************/


//
// initializeAudioContext()
//
// A user gesture is required to create an AudioContext
// Cannot be called from drag-and-drop; Must be from a direct button press, click, key input, etc.
//
WebELANViz.prototype.initializeAudioContext = function() {
  if (this.audioContext === undefined) {
    this.audioContext = new AudioContext();
  }
};

//
// loadAudio(file)
//
// Takes an audio file from the browser (file)
// Loads the Audio and creates a buffer
//
WebELANViz.prototype.loadAudio = function(file) {
	var self = this;  //to use in the Promise scope below
	return new Promise(function(resolve, reject) {
		var reader = new FileReader();
		reader.onload = function(e) {
			var arrayBuffer = e.target.result;
			self.audioContext.decodeAudioData(arrayBuffer, function(buffer) {
				self.audio = self.audioContext.createBufferSource();
				self.audio.buffer = buffer;
				self.audio.connect(self.audioContext.destination);
				self.audio.start(0);
				
				resolve();
			});
		};
		reader.readAsArrayBuffer(file);
	});
}

//
// initializeSpectrogram()
//
// uses FFT analyser
// for a live version see: https://guamlinguistics.com/spectrogram/
//
WebELANViz.prototype.initializeSpectrogram = function() {
	"use strict";
	
	//get elements from the HTML Document and define variables
    this.spectrogram.canvas = document.getElementById('spectrogram');
    this.spectrogram.ctx = this.spectrogram.canvas.getContext('2d');
	this.waveform.draw_region = document.getElementById('waveform');
    this.waveform.polygon = document.getElementById('waveform_fill');
	
    this.spectrogram.smoothing = 15;
	this.spectrogram.fftBins = 2048; //needs to be a power of 2 between 2^5 and 2^15
	this.spectrogram.fftTemporalSmoothing = 0.0; //[0,1), default 0.2 -- 0 best for spectrogram, but higher better for formant finding
    
	var self = this;  //to use in the Promise scope below
	return new Promise(function(resolve, reject) {
		self.analyser = self.audioContext.createAnalyser();
		self.audio.connect(self.analyser);
		self.analyser.fftSize = self.spectrogram.fftBins;
		self.analyser.smoothingTimeConstant = self.spectrogram.fftTemporalSmoothing;
		
		self.spectrogram.frequencyArray = new Uint8Array(self.analyser.frequencyBinCount);
		
		resolve();
	});
};

WebELANViz.prototype.drawSpectrogram = function(time1, time2) {
	
	//functions here limited to 255 bins --
	//getByteFrequencyData() only takes 256 bins, discards anything over, ignores remaining under size
	//getFloatFrequencyData() has wider values, but is slower
	this.analyser.getByteFrequencyData(this.spectrogram.frequencyArray);
	
	//draw spectrogram
	for (var i = 0 ; i < 255; i++) {
		ctx.fillStyle = "hsl(0, 0%, " + (frequencyArray[i]/2.55) + "%)";  //black w. white highlights
		//ctx.fillStyle = "hsl(0, 0%, " + (100 - (frequencyArray[i]/2.55)) + "%)"; //invert
		//ctx.fillStyle = "hsl(" + 300*(.8 - frequencyArray[i]/255) + ", 100%, " + "50%)";//(100 - 0.6*(frequencyArray[i]/2.55)) + "%)"; //color
		ctx.fillRect(canvas.width-1, canvas.height - (i/255)*canvas.height, 1,1);
	}
}

WebELANViz.prototype.drawWaveform = function(time1, time2) {
	
	this.waveform.draw_region.setAttribute('viewBox', '0 0 255 255');
	var poly_text = "0,255 ";
	
	//
	//some procedure for waveform
	//
	
	//close off polygon and draw
	poly_text += "0,0 0,255";
	polygon.setAttribute('points', poly_text);
}


