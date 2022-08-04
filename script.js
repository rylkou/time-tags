let player;
let videoId;
let id = 0;

document.addEventListener("DOMContentLoaded", function (event) {
    videoId = localStorage.getItem('videoId');
    if (videoId !== null) {
        document.getElementById("txtVideoURL").value = 'https://youtu.be/' +
                videoId;
    }
});

// This code loads the IFrame Player API code asynchronously.
let tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
let firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// get URL from input field and open player
document.getElementById("btnOpen").onclick = function () {
    let errorDiv = document.getElementById("error");
    let url = document.getElementById("txtVideoURL").value;
    videoId = getVideoIDFromURL(url);
    if (!videoId) {
        errorDiv.style.display = "block";
    } else {
        errorDiv.style.display = "none";
        let urlDiv = document.getElementById("urlGroup");
        urlDiv.style.display = "none";
        let exportDiv = document.getElementById("tabTxtEditor");
        exportDiv.style.display = "flex";

        localStorage.setItem('videoId', videoId);
        let source = localStorage.getItem('timeTags');
        let exportTxt = document.getElementById("txtEditor");
        exportTxt.value = source;

        createPlayer(videoId);
    }
};

document.getElementById("btnNewTag").onclick = function () {
    addNewTag();
    saveFromVisualEditor();
};

function addNewTag(seconds, description) {
    let checked = false;

    if (seconds === undefined) {
        seconds = Math.floor(player.getCurrentTime());
        checked = true;
    }

    let referenceRow = getReferenceRow(seconds);

    let rows = document.getElementById("rows");
    let row = document.createElement("div");
    row.className = "row";
    row.id = ++id;
    row.dataset.seconds = seconds;
    rows.insertBefore(row, referenceRow);

    let radio = document.createElement("input");
    radio.name = "selectedRow";
    radio.type = "radio";
    radio.id = "radio" + id;
    radio.checked = checked;
    row.appendChild(radio);
    radio.focus();

    let hms = formatTime(seconds);
    let a = document.createElement("a");
    a.className = "time";
    a.id = "time" + id;
    a.innerHTML = hms;
    a.href = "";
    a.onclick = function () {
        player.seekTo(seconds);
        radio.checked = true;
        return false;
    };
    row.appendChild(a);

    let inputDescription = document.createElement("input");
    inputDescription.className = "txtDescription";
    inputDescription.spellcheck = "true";
    inputDescription.type = "text";
    inputDescription.id = "txt" + id;
    inputDescription.placeholder = "Paste Tag Description here...";
    if (description !== undefined) {
        inputDescription.value = description;
    }
    inputDescription.onfocus = function () {
        radio.checked = true;
    };
    inputDescription.onblur = function () {
        saveFromVisualEditor();
    };
    row.appendChild(inputDescription);
}

document.getElementById("btnDel").onclick = function () {

    let radio = document.querySelector('input[name="selectedRow"]:checked');

    if (radio !== null) {
        let row = radio.parentElement;
        let id = row.id;
        let hms = document.getElementById("time" + id).innerHTML;
        let txt = document.getElementById("txt" + id).value;
        if (confirm('Remove ' + hms + " " + txt)) {
            row.remove();
            saveFromVisualEditor();
        }
    }
};

document.getElementById("btnLeft5").onclick = function() {seek(-5);};
document.getElementById("btnLeft").onclick = function() {seek(-1);};
document.getElementById("btnRight").onclick = function() {seek(1);};
document.getElementById("btnRight5").onclick = function() {seek(5);};

function seek(dseconds) {

    let radio = document.querySelector('input[name="selectedRow"]:checked');

    if (radio !== null) {
        let row = radio.parentElement;
        let seconds = parseInt(row.dataset.seconds);
        let newSeconds = seconds + dseconds;
        if (newSeconds < 0) {
            newSeconds = 0;
        }
        if (newSeconds > player.getDuration()) {
            newSeconds = player.getDuration();
        }
        row.dataset.seconds = newSeconds;
        let hms = formatTime(newSeconds);
        let a = document.getElementById("time" + row.id);
        a.innerHTML = hms;
        a.onclick = function () {
            player.seekTo(newSeconds);
            radio.checked = true;
            return false;
        };
        player.seekTo(newSeconds);
        checkRowsOrder(row);
        saveFromVisualEditor();
    }
}

function checkRowsOrder(row) {

    let seconds = parseInt(row.dataset.seconds);
    let nextRow = row.nextSibling;
    let previousRow = row.previousSibling;
    let referenceRow = getReferenceRow(seconds);
    let rows = document.getElementById("rows");

    if (nextRow !== null) {
        let nextSeconds = parseInt(nextRow.dataset.seconds);
        if (nextSeconds < seconds) {
            row.remove();
            rows.insertBefore(row, referenceRow);
            return;
        }
    }

    if (previousRow !== null) {
        let previousSeconds = parseInt(previousRow.dataset.seconds);
        if (previousSeconds > seconds) {
            row.remove();
            rows.insertBefore(row, referenceRow);
        }
    }
}

function saveFromVisualEditor() {
    let result = getSourceFromVisualEditor();
    localStorage.setItem('timeTags', result);
    return result;
}

document.getElementById("btnTxtEditor").onclick = function () {
    let result = saveFromVisualEditor();
    let exportDiv = document.getElementById("tabTxtEditor");
    let exportTxt = document.getElementById("txtEditor");
    exportTxt.value = result;
    exportDiv.style.display = "flex";
    let editorDiv = document.getElementById("tabVisualEditor");
    editorDiv.style.display = "none";

};

function getSourceFromVisualEditor() {
    let rows = document.getElementsByClassName("row");
    let result = "";
    Array.prototype.forEach.call(rows, function (row) {
        let id = row.id;
        let hms = document.getElementById("time" + id).innerHTML;
        let txt = document.getElementById("txt" + id).value;
        result = result + hms + " " + txt.trim() + "\n";
    });
    result = result.trim();
    return result;
}

document.getElementById("btnVisualEditor").onclick = function () {
    let exportDiv = document.getElementById("tabTxtEditor");
    exportDiv.style.display = "none";
    let editorDiv = document.getElementById("tabVisualEditor");
    editorDiv.style.display = "flex";

    clearVisualEditor();

    // TODO support multirow description
    let exportTxt = document.getElementById("txtEditor");
    source = exportTxt.value;
    let strings = source.split("\n");
    for (let i = 0; i < strings.length; i++) {
        let timeTag = strings[i].trim();
        let hms = timeTag.split(" ")[0];
        if (hms !== "") {
            let seconds = hmsToSecondsOnly(hms);
            let description = timeTag.substring(hms.length).trim();
            addNewTag(seconds, description);
        }
    }
};

function clearVisualEditor() {
    let rows = document.getElementById("rows");
    while (rows.firstChild) {
        rows.removeChild(rows.firstChild);
    }
}

// used to paste HTML tag before the reference tag
function getReferenceRow(seconds) {
    let rows = document.getElementsByClassName("row");
    let reference = null;
    Array.prototype.forEach.call(rows, function (row) {
        let secondsI = parseInt(row.dataset.seconds);
        if (seconds < secondsI) {
            if (reference === null
                    || (parseInt(reference.dataset.seconds) < seconds
                    && secondsI !== parseInt(reference.dataset.seconds))) {
                reference = row;
            }
        }
    });
    return reference;
}

// Creates an <iframe> (and YouTube player)
function createPlayer(id) {

    let width = window.innerWidth;
    let height = Math.round(width / 16 * 9);
    player = new YT.Player('player', {
        height: height,
        width: "100%",
        videoId: id,
        events: {
            'onReady': onPlayerReady
        }
    });

}

// The API will call this function when the video player is ready.
function onPlayerReady(event) {
}

function getVideoIDFromURL(url) {
    var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    var match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : false;
}

function formatTime(totalSeconds) {
    let hours = Math.floor(totalSeconds / 3600);
    totalSeconds %= 3600;
    let minutes = Math.floor(totalSeconds / 60);
    let seconds = totalSeconds % 60;

    let result;

    if (hours > 0) {
        result = hours + ":" +
                String(minutes).padStart(2, "0") + ":" +
                String(seconds).padStart(2, "0");
    } else {
        result = minutes + ":" + String(seconds).padStart(2, "0");
    }

    return result;
}

function hmsToSecondsOnly(str) {
    let p = str.split(':'),
        s = 0, m = 1;

    while (p.length > 0) {
        s += m * parseInt(p.pop(), 10);
        m *= 60;
    }

    return s;
}

window.onbeforeunload = function() {
    if (!confirm('Exit?')) {
        return false;
    }
};