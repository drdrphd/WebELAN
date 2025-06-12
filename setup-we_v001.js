///
/// process_elan.js
/// 
/// much loading code from: https://blog.soshace.com/the-ultimate-guide-to-drag-and-drop-image-uploading-with-pure-javascript/
///
/// 

//
//UI methods
//

var elan = new WebELAN(); // for debugging -- move internal when done
var elan_viz = new WebELANViz();



function saveEAF(){	//testing how to export / add new blocks to the ELAN file
	elan.exportEAF();
}


window.onload = function(){
	
	//document elements
	const tier_preview = document.querySelector("#tier-preview");
	const tier_input = document.querySelector("#tier-input");
	const tier_output = document.querySelector("#tier-output");

	dragAndDropEAF();
	dragAndDropAudio();

	//
	// DRAG & DROP
	//
	function dragAndDropEAF() {
	
		const dropRegion = document.getElementById("user-input");

		// open file selector when clicked on the drop region
		const hiddenInput = document.createElement("input");
		hiddenInput.type = "file";
		hiddenInput.accept = ".eaf";
		hiddenInput.multiple = false;
		dropRegion.addEventListener('click', function() {
			hiddenInput.click();
		});
		
		//normal file loader is ugly -- keep hidden and just tie to drag and drop
		hiddenInput.addEventListener("change", function() {
			var file = hiddenInput.files[0];
			elan.loadEAF(file)
			.then(function() {
				onLoadEAF();
			})
			.catch(function(error) {
				console.error(error);	//*** to-do: better error handling ***
			});
		});
		
		//don't allow default browser behavior of immediately loading the file
		function preventDefault(e) {
			e.preventDefault();
			  e.stopPropagation();
		}
		dropRegion.addEventListener('dragenter', preventDefault, false);
		dropRegion.addEventListener('dragleave', preventDefault, false);
		dropRegion.addEventListener('dragover', preventDefault, false);
		dropRegion.addEventListener('drop', preventDefault, false);
	
		//handle drag and drop
		function handleDrop(e) {
			var data = e.dataTransfer;
			var file = data.files[0];
			elan.loadEAF(file)
			.then(function() {
				onLoadEAF();
			})
			.catch(function(error) {
				console.error(error);	//*** to-do: better error handling ***
			});
		}
		dropRegion.addEventListener('drop', handleDrop, false);
	}
	
	
	
	//Maybe move this somewhere else...
	//Yes, this basically replicates the above function, but generalizing them was awkward
	function dragAndDropAudio() {
	
		const dropRegion = document.getElementById("audio-input");
		
		// open file selector when clicked on the drop region
		const hiddenInput = document.createElement("input");
		hiddenInput.type = "file";
		hiddenInput.accept = "audio/*";
		hiddenInput.multiple = false;
		dropRegion.addEventListener('click', function() {
			hiddenInput.click();
		});
		
		//normal file loader is ugly -- keep hidden and just tie to drag and drop
		hiddenInput.addEventListener("change", function() {
			var file = hiddenInput.files[0];
			onAudioDrop(file);
		});
		
		//don't allow default browser behavior of immediately loading the file
		function preventDefault(e) {
			e.preventDefault();
			e.stopPropagation();
		}
		dropRegion.addEventListener('dragenter', preventDefault, false);
		dropRegion.addEventListener('dragleave', preventDefault, false);
		dropRegion.addEventListener('dragover', preventDefault, false);
		dropRegion.addEventListener('drop', preventDefault, false);
	
		//handle drag and drop
		function handleDrop(e) {
			var data = e.dataTransfer;
			var file = data.files[0];
			onAudioDrop(file);
		}
		
		dropRegion.addEventListener('drop', handleDrop, false);
	}
	
	
	//
	// AUDIO FILE LOAD
	//
	
	//
	// Drag-and-drop is not an acceptable user-interaction for starting AudioContext
	// This is triggered in response to a Button
	//
	// display filename and load button
	function onAudioDrop(file) {
		document.getElementById("audio-input").style.display = "none";
		document.getElementById("load-audio-filename").innerHTML = file.name;
		document.getElementById("load-audio-container").style.display = "flex";
		
		document.getElementById("load-audio-button").addEventListener('click', function() {
			loadAudioByButtonPress(file);
		});
	}
	function loadAudioByButtonPress(file) {
		elan_viz.initializeAudioContext(); // Create AudioContext on user gesture
		elan_viz.loadAudio(file).then(function() {
			elan_viz.initializeSpectrogram()
			.then(function() {
				onLoadAudio();
			})
			.catch(function(error) {	//spectrogram promise
				console.error(error);	//*** to-do: better error handling ***
			});
		})
		.catch(function(error) {	//audio-load promise
			console.error(error);	//*** to-do: better error handling ***
		});
	}
	
	function onLoadAudio() {
		document.getElementById("load-audio-container").style.display = "none";
		document.getElementById("audio-display").style.display = "block";
	}
	
	
	
	//
	// ELAN FILE PROCESSES
	//
	function onLoadEAF() {
		document.getElementById("user-input").style.display = "none";
		document.getElementById("elan").style.display = "block";
		
		
	}

	
	function displayTierText(tiers) {

		var transcriptions = [];
		var times = elan.times();
		
		for (var i = 0; i < tiers.length; i++) {
			transcriptions.push(tiers[i].getElementsByTagName("ANNOTATION"));
		}
		
		document.getElementById("text").innerHTML = ""; //reset
		
		for (var i = 0; i < transcriptions.length; i++) {
			var annotations = transcriptions[i];
			
			for (var j = 0; j < annotations.length; j++){
				var start_time = elan.getAnnotationStartTime(annotations[j]);
				
				var show_times = false;
				for (var k = 0; k < times.length; k++){
					if (start_time == times[k].getAttribute("TIME_SLOT_ID")) {
						start_time = msToMinSec(times[k].getAttribute("TIME_VALUE"));
						show_times = true;
					}
				}
				if (show_times) {
					document.getElementById("text").innerHTML += 
						("<small>" + start_time + "&emsp;</small>");
				}
				document.getElementById("text").innerHTML += 
					(annotations[j].getElementsByTagName("ANNOTATION_VALUE")[0].innerHTML + "</br>");
			}
		}
	}
	
	
	// Returns a Promise that resolves after "ms" Milliseconds
	function timer(ms) {
		return new Promise(res => setTimeout(res, ms));
	}
}








