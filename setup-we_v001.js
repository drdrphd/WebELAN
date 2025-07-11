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

	//**** All this top stuff should be moved to an update function that is called anytime an input is updated ****
	var annotation_inputs = document.getElementsByClassName("annotation");
	var elanXML_annotations = elan.elan_file.getElementsByTagName("ANNOTATION");
	for (var i = 0; i < annotation_inputs.length; i++) {
		for (var j = 0; j < elanXML_annotations.length; j++) {
			if (annotation_inputs[i].id == elanXML_annotations[j].children[0].getAttribute("ANNOTATION_ID")) {
				// Key to the followng line:
				// elan Object. XML. elan file <ANNOTATION>s. (<REF_ANNOTATION> || <ALIGNABLE_ANNOTATION>). <ANNOTATION_VALUE>. text:___. text value
				elan.elan_file.getElementsByTagName("ANNOTATION")[j].children[0].children[0].childNodes[0].nodeValue = annotation_inputs[i].value;
			}
		}
	}
	
	elan.exportEAF();
}
function zoomIn(){
	var current_width = getComputedStyle(document.getElementById("tiers")).width;  //string with "...px"
	current_width = current_width.substring(0, current_width.length - 2);  //take off "...px"
	document.getElementById("tier-content").scrollLeft = (document.getElementById("tier-content").scrollLeft / current_width) * current_width * 1.15;
	elan_viz.zoomIn(1.15);
}
function zoomOut(){
	var current_width = getComputedStyle(document.getElementById("tiers")).width;
	current_width = current_width.substring(0,current_width.length - 2);  //take off "...px"
	document.getElementById("tier-content").scrollLeft = (document.getElementById("tier-content").scrollLeft / current_width) * current_width / 1.15;
	elan_viz.zoomOut(1.15);
}


window.onload = function(){
	
	//document elements


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
		
		//choose palette?
		
		//load material from tiers into window
		setupTiers(elan.tiers());
	}

	
	//
	// setupTiers([Tiers])
	//
	// Takes an array of Tier objects and lays out the tiers, tier names, and content blocks
	//
	function setupTiers(tiers) {
		
		var scaling = 10;	//absolute position by milliseconds is too wide; scale down
		
		tiers = elan.sortTiersHierarchical(tiers);
		document.getElementById("tiers").style.width = "calc( var(--hzoom) * " + (+elan.getMaxTime() + 100)/scaling + "px)";	//set up the overall width of the tier container / background
		
		
		for (var i = 0; i < tiers.length; i++) {
			const annotations = tiers[i].annotations;
			
			//set up the label for the tier on the left edge
			const new_tier_label = document.createElement("div");
			new_tier_label.classList.add("tier-label");
			new_tier_label.innerHTML = tiers[i].name + " [" + annotations.length + "]";
			document.getElementById("tier-labels").appendChild(new_tier_label);
			
			//set up the tier
			const new_tier = document.createElement("div");
			new_tier.classList.add("tier");
			
			//add a content block on the tier for the annotations
			const new_tier_content = document.createElement("div");
			new_tier_content.classList.add("tier-content");
			
			//add the annotations
			for (var j = 0; j < annotations.length; j++) {
				const new_annotation_input = document.createElement("input");
				new_annotation_input.type = "text";
				new_annotation_input.id = annotations[j].id;
				new_annotation_input.value = annotations[j].value;
				new_annotation_input.classList.add("annotation");
				
				new_annotation_input.style.left = "calc( var(--hzoom) * " + annotations[j].start/scaling + "px)";
				new_annotation_input.style.width = "calc( var(--hzoom) * " + (annotations[j].end - annotations[j].start)/scaling + "px)";
				
				new_tier_content.appendChild(new_annotation_input);
			}
			
			new_tier.appendChild(new_tier_content);
			document.getElementById("tiers").appendChild(new_tier);
		}
	}
}





