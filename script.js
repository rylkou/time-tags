let player;
let videoId;
let id = 0;
let REMOVE = 'Remove';
let REMOVE_ALERT = 'Select Tag using Radio Button before remove it';
let MOVE_ALERT = 'Select Tag using Radio Button before move it';
let TAG_PLACEHOLDER = 'Paste Tag Description here...';

function translate() {
    if (navigator.language.startsWith('ru')) {
        document.getElementById("txtVideoURL").placeholder = "Вставьте URL-ссылку на YouTube видео...";
        document.getElementById("btnOpen").value = "Открыть видео";
        document.getElementById("error").innerHTML = "Проверьте формат URL-ссылки";
        document.getElementById("btnVisualEditor").value = "Переключить в визуальный редактор";
        document.getElementById("btnTxtEditor").value = "В текстовый редактор";
        document.getElementById("btnNewTag").value = "Добавить метку";
        REMOVE = 'Удалить';
        REMOVE_ALERT = 'Перед удалением метки выделите её с помощью радиокнопки';
        MOVE_ALERT = 'Перед перемещением метки выделите её с помощью радиокнопки';
        TAG_PLACEHOLDER = 'Вставьте описание метки здесь...';
    }
    if (navigator.language.startsWith('be')) {
        document.getElementById("txtVideoURL").placeholder = "Устаўце URL-спасылку на YouTube відэа...";
        document.getElementById("btnOpen").value = "Адкрыць відэа";
        document.getElementById("error").innerHTML = "Праверце фармат URL-спасылкі";
        document.getElementById("btnVisualEditor").value = "Пераключыць у візуальны рэдактар";
        document.getElementById("btnTxtEditor").value = "У тэкставы рэдактар";
        document.getElementById("btnNewTag").value = "Дадаць метку";
        REMOVE = 'Выдаліць';
        REMOVE_ALERT = 'Перад выдаленнем меткi вылучыце яе з дапамогай радыёкнопкі';
        MOVE_ALERT = 'Перад перамяшчэннем меткi вылучыце яе з дапамогай радыёкнопкі';
        TAG_PLACEHOLDER = 'Устаўце апісанне меткі тут...';
    }
}

// This code loads the IFrame Player API code asynchronously.
let tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
let firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

document.addEventListener("DOMContentLoaded", function (event) {
    videoId = localStorage.getItem('videoId');
    if (videoId !== null) {
        document.getElementById("txtVideoURL").value = 'https://youtu.be/' +
                videoId;
    }

    translate();
});

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

function btnMoveGroupShow() {
    document.getElementById("btnMoveGroup").style.display = "block";
}

function btnMoveGroupHide() {
    document.getElementById("btnMoveGroup").style.display = "none";
}

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
    radio.onclick = function () {
        btnMoveGroupShow();
    };
    row.appendChild(radio);

    let hms = formatTime(seconds);
    let a = document.createElement("a");
    a.className = "time";
    a.id = "time" + id;
    a.innerHTML = hms;
    a.href = "";
    a.onclick = function () {
        player.seekTo(seconds);
        radio.checked = true;
        btnMoveGroupShow();
        return false;
    };
    row.appendChild(a);

    let inputDescription = document.createElement("input");
    inputDescription.className = "txtDescription";
    inputDescription.spellcheck = "true";
    inputDescription.type = "text";
    inputDescription.id = "txt" + id;
    inputDescription.placeholder = TAG_PLACEHOLDER;
    if (description !== undefined) {
        inputDescription.value = description;
    }
    inputDescription.onfocus = function () {
        radio.checked = true;
        btnMoveGroupShow();
    };
    inputDescription.onblur = function () {
        saveFromVisualEditor();
    };
    row.appendChild(inputDescription);
    if (checked) {
        inputDescription.focus();
    }
}

document.getElementById("btnDel").onclick = function () {

    let radio = document.querySelector('input[name="selectedRow"]:checked');
    let row = radio.parentElement;
    let id = row.id;
    let hms = document.getElementById("time" + id).innerHTML;
    let txt = document.getElementById("txt" + id).value;
    if (confirm(REMOVE + ' ' + hms + " " + txt)) {
        row.remove();
        saveFromVisualEditor();
        btnMoveGroupHide();
    }

};

document.getElementById("btnLeft5").onclick = function() {seek(-5);};
document.getElementById("btnLeft").onclick = function() {seek(-1);};
document.getElementById("btnRight").onclick = function() {seek(1);};
document.getElementById("btnRight5").onclick = function() {seek(5);};

function seek(dseconds) {

    let radio = document.querySelector('input[name="selectedRow"]:checked');
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

document.getElementById("btnPlaybackSpeed").onclick = function () {
    let speed = +this.value.slice(0, -1);
    if (speed === 2) {
        speed = 1;
    }
    else {
        speed = 2;
    }
    this.value = speed + "x";
    player.setPlaybackRate(speed);

};

document.getElementById("btnTxtEditor").onclick = function () {
    let result = saveFromVisualEditor();
    let exportDiv = document.getElementById("tabTxtEditor");
    let exportTxt = document.getElementById("txtEditor");
    exportTxt.value = result;
    exportDiv.style.display = "flex";
    let editorDiv = document.getElementById("tabVisualEditor");
    editorDiv.style.display = "none";
    btnMoveGroupHide();

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

    let exportTxt = document.getElementById("txtEditor");
    source = exportTxt.value;
    let strings = source.split("\n");
    let seconds = -1;
    let description = "";
    for (let i = 0; i < strings.length; i++) {
        let timeTag = strings[i].trim();
        let hms = timeTag.split(" ")[0];
        if (hms !== "") {
            let secondsOrDescription = hmsToSecondsOnly(hms);
            if (isNaN(secondsOrDescription)) {
                description = description + " " + timeTag;
            }
            else {
                if (seconds !== -1) {
                    addNewTag(seconds, description);
                }
                seconds = secondsOrDescription;
                description = timeTag.substring(hms.length).trim();
            }
        }
    }
    if (seconds !== -1) {
        addNewTag(seconds, description);
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
    var regExp = /^.*((youtu.be\/)|(live\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))(\?v=)?([^#&?]*).*/;
    var match = url.match(regExp);
    return (match && match[9].length === 11) ? match[9] : false;
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
    if (str.indexOf(':') === -1) {
        return Number.NaN;
    }

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