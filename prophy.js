//
// Prophy
//
// Web-Technologien Hausarbeit SS-19-01
//
// Eine Wetterapp basierend auf OpenWeatherMap.org die im Rahmen der
// Web-Technologien Veranstaltung geschrieben wurde.
//
// Kreiert von Linus Frotscher - 630063
//
// ----------------------------------------------------------------------------------

'use strict';

// ----------------------------------------------------------------------------------
// Startfunktion, wird beim Aufruf der Seite gerufen.
// Beim Start werden automatisch 3 Dinge gestartet.
//  1. Verbindung zum Websocket Server wird hergestellt
//  2. Shortcuts für die Applikation werden initialisiert
//  3. Der Nutzer wird zur Homepage bzw. Anmeldung navigiert
// ----------------------------------------------------------------------------------
window.addEventListener('load', async () => {
    // -----------------------------------------------------------------------------------------------------------------------------------------------
    //
    // 1. Websocket
    //
    // Der Websocket part ist dafür zuständig, Nutzer-Sessions über mehrere
    // Clients hinweg zu synchronisieren.
    //
    // Über den Websocket wird immer eine Nachricht verschickt, wenn Änderungen
    // am Nutzer stattgefunden haben.
    //
    // Bei Empfang einer Nachricht wird geprüft, ob diese für den Nutzer relevant ist,
    // und dann der Nutzer entsprechend angepasst.
    //
    // ----------------------------------------------------------------------------------

    let ws;

    // ----------------------------------------------------------------------------------
    // createWebsocket erstellt eine Instanz eines Websockets und definiert
    // EventListener für einkommende Nachrichten.
    // ----------------------------------------------------------------------------------
    const createWebsocket = (() => {
        try {
            // erstellt Websocket
            ws = new WebSocket('ws://localhost:8080');

            // beim Öffnen
            ws.onopen = () => {
                console.log('websocket connected');
            };

            // beim Schließen
            ws.onclose = () => {
                console.log('websocket disconnected');
            };

            // Eventlistener für Nachrichten
            ws.onmessage = event => {
                if (event.data.substring(0, 3) === '+++') {
                    return;
                }

                // dechiffriere die Nachricht
                let decrypted = decode(event.data);
                try {
                    let json = JSON.parse(decrypted);
                    if (
                        // Prüft ob die Nachricht für die Applikation ist
                        json['identifier'] === 'prophy_630063'
                    ) {
                        let message = JSON.parse(json['message']);

                        let storage = JSON.parse(localStorage.storage);

                        // ersetzt den Storage durch dessen neuen Zustand
                        storage = message;

                        localStorage.storage = JSON.stringify(storage);

                        // Bringt den Nutzer mit den neuem Zustand zur Homepage.
                        if (json['user'] !== localStorage.loggedIn) {
                            localStorage.removeItem('loggedIn');
                        }
                        navLink('home');
                    }
                } catch (e) {
                    if (typeof e === 'string')
                        if (!e.contains('unexpected Token')) console.log(e);
                }
            };
        } catch (e) {
            console.log(event.message);
            reconnect();
        }
    })();

    // ----------------------------------------------------------------------------------
    // Der Encoder nimmt eine Nachricht und verschlüsselt diese mit einem
    // simplen Verschiebungsverfahren.
    // Außerdem wird der Absender und die Kennung der Applikation eingefügt.
    // ----------------------------------------------------------------------------------
    const encode = message => {
        let json = {
            message: message,
            identifier: 'prophy_630063',
            user: localStorage.loggedIn
        };
        let jsonString = JSON.stringify(json);
        let encrypted = '';
        for (let i = 0; i < jsonString.length; i++) {
            let char = jsonString.charCodeAt(i);
            encrypted += String.fromCharCode(char + 15);
        }
        return encrypted;
    };

    // ----------------------------------------------------------------------------------
    // Der Decoder nimmt eine Nachricht und entschlüsselt diese.
    // ----------------------------------------------------------------------------------
    let decode = message => {
        let decrypted = '';
        for (let i = 0; i < message.length; i++) {
            let char = message.charCodeAt(i);
            decrypted += String.fromCharCode(char - 15);
        }
        return decrypted;
    };

    // ----------------------------------------------------------------------------------
    // sendChanges wird gerufen um Änderungen am Nutzer an andere Clients
    // der Applikation zu schicken.
    // ----------------------------------------------------------------------------------
    const sendChanges = () => {
        if (ws === null || ws.readyState != WebSocket.OPEN) {
            console.log('websocket connection not established');
            return;
        }

        let storage = JSON.parse(localStorage.storage);

        let encrypted = encode(JSON.stringify(storage));

        try {
            ws.send(encrypted);
        } catch (e) {
            console.log(event.message);
        }
    };

    // Reconnect wird gerufen um die Verbindung zum Websocket Server neu herzustellen.
    const reconnect = () => {
        window.location.reload();
        console.log('websocket reconnected');
    };

    // CloseConnection wird gerufen um die Verbindung zum Websocket Server zu beenden.
    const closeConnection = () => {
        if (ws != null) ws.close();
        ws = null;
    };

    // -----------------------------------------------------------------------------------------------------------------------------------------------
    //
    // 2. DOM
    //
    // Der Dom-Part enthält viele Hilfsfunktionen und Switches.
    // Außerdem sind hier viele Funktionen die das Dom manipulieren.
    //
    // ----------------------------------------------------------------------------------

    // ----------------------------------------------------------------------------------
    // createHeaderNavigationIcons erstellt die Navigationselemente
    // für die Navigationsleiste.
    // Diese besteht aus Icons mit Event Listenern, welche über den NavLink
    // zur entsprechenden Ansicht navigieren.
    // ----------------------------------------------------------------------------------
    function createHeaderNavigationIcons() {
        clearHeaderNavigationIcons();

        // Hompepage Icon
        let currentPlace = createDIV('currentPlace');
        currentPlace.className = 'headerIcon';
        currentPlace.addEventListener('click', () => {
            navLink('home');
        });

        let placeIcon = document.createElement('I');
        placeIcon.className = 'fas fa-home';

        currentPlace.append(placeIcon);

        // Favoriten Icon
        let favorites = createDIV('favorites');
        favorites.className = 'headerIcon';
        favorites.addEventListener('click', () => {
            navLink('favorites');
        });

        let favoritesIcon = document.createElement('I');
        favoritesIcon.className = 'fas fa-star';

        favorites.append(favoritesIcon);

        // Such Icon
        let search = createDIV('search');
        search.className = 'headerIcon';
        search.addEventListener('click', () => {
            navLink('search');
        });

        let searchIcon = document.createElement('I');
        searchIcon.className = 'fas fa-search';

        search.append(searchIcon);

        document
            .getElementsByClassName('leftContainer')[0]
            .append(currentPlace);
        document.getElementsByClassName('leftContainer')[0].append(favorites);
        document.getElementsByClassName('leftContainer')[0].append(search);
    }

    // ----------------------------------------------------------------------------------
    // clearHeaderNavigationIcons löscht alle Navigations Icons
    // aus der Navigationsleiste.
    // Die Funktion wird verwendet wenn Nutzer abgemeldet werden.
    // ----------------------------------------------------------------------------------
    function clearHeaderNavigationIcons() {
        if ($('currentPlace')) {
            document
                .getElementsByClassName('leftContainer')[0]
                .removeChild($('currentPlace'));
            document
                .getElementsByClassName('leftContainer')[0]
                .removeChild($('favorites'));
            document
                .getElementsByClassName('leftContainer')[0]
                .removeChild($('search'));
        }
    }

    // ----------------------------------------------------------------------------------
    // createUserField erstellt die Nutzerleiste in der oberen Rechten Ecke
    // Hier kann der Nutzer zu seinen Einstellungen gehen, sich abmelden,
    // oder seinen Account löschen.
    // Außerdem kann er seinen Nutzernamen nachgucken, falls er sich diesen
    // nicht merken kann.
    // ----------------------------------------------------------------------------------
    function createUserField() {
        clearUser();

        // Klassenname anpassen, damit das entsprechende CSS greift.
        $('user').className = 'loggedIn';

        // Nutzernamen anzeigen
        let userText = createDIV('userText');
        userText.innerText = localStorage.loggedIn;

        // Nutzereinstellungen Icon
        let userSettings = document.createElement('I');
        userSettings.className = 'fas fa-user-cog';
        userSettings.id = 'userSettings';
        userSettings.addEventListener('click', () => {
            navLink('userSettings');
        });

        // Abmelden Icon
        let userLogout = document.createElement('I');
        userLogout.className = 'fas fa-sign-out-alt';
        userLogout.id = 'userLogout';
        userLogout.addEventListener('click', () => {
            localStorage.removeItem('loggedIn');
            navLink();
        });

        // Account löschen Icon
        let userDelete = document.createElement('I');
        userDelete.className = 'fas fa-trash-alt';
        userDelete.id = 'userDelete';
        userDelete.addEventListener('click', () => {
            if (localStorage.storage !== undefined) {
                let deleted = false;
                let name = localStorage.loggedIn;
                let storage = JSON.parse(localStorage.storage);
                for (let i = 0; i < storage.users.length && !deleted; i++) {
                    if (storage.users[i].name === name) {
                        storage.users.splice(i, 1);
                        localStorage.storage = JSON.stringify(storage);
                        deleted = true;
                    }
                }
            }

            localStorage.removeItem('loggedIn');
            sendChanges();
            navLink();
        });

        $('user').append(userText);
        $('user').append(userSettings);
        $('user').append(userLogout);
        $('user').append(userDelete);
    }

    // ----------------------------------------------------------------------------------
    // Settings bringt den Nutzer zur Nutzereinstellungsansicht
    // ----------------------------------------------------------------------------------
    function Settings() {
        this.createSettingsCard = () => {
            $('contentContainer').append(new LoginCard(true));
        };
        this.createSettingsCard();
    }

    // ----------------------------------------------------------------------------------
    // createToggleButton erstellt einen doppelten Button, welcher als Switch
    // verwendet wird. Hier wird ausgesucht ob die Tagesansicht oder
    // die Vorhersageübersicht angezeigt werden soll.
    // ----------------------------------------------------------------------------------
    function createToggleButton() {
        let toggleButton = createDIV('toggleButton');

        // linke hälfte
        let toggleButtonLeft = document.createElement('BUTTON');
        toggleButtonLeft.id = 'toggleButtonLeft';
        toggleButtonLeft.className = 'toggleActive';
        toggleButtonLeft.innerText = 'Heute';
        toggleButtonLeft.addEventListener('click', () => {
            navLink('home');
        });

        // rechte Hälfte
        let toggleButtonRight = document.createElement('BUTTON');
        toggleButtonRight.id = 'toggleButtonRight';
        toggleButtonRight.className = 'toggleNotActive';
        toggleButtonRight.innerText = '5 Tage';
        toggleButtonRight.addEventListener('click', () => {
            $('toggleButtonLeft').className = 'toggleNotActive';
            $('toggleButtonRight').className = 'toggleActive';
            let cityName = $('currentWeatherHeader').innerText;
            createWeatherForecast(cityName);
        });

        toggleButton.append(toggleButtonLeft);
        toggleButton.append(toggleButtonRight);
        $('contentContainer').append(toggleButton);
    }

    // ----------------------------------------------------------------------------------
    // clearContent leert die Content Div komplett.
    // contentContainer ist das Root-Element dieser Single-Page-Application.
    // Sie wird also als Ausgangspunkt für alle Ansichten verwendet.
    // ----------------------------------------------------------------------------------
    function clearContent() {
        let container = $('contentContainer');

        while (container.hasChildNodes())
            container.removeChild(container.firstChild);
    }

    // ----------------------------------------------------------------------------------
    // clearUser löscht alle Nutzer Icons aus der
    // oberen Rechten Ecke.
    // Die Funktion wird verwendet wenn Nutzer abgemeldet werden.
    // ----------------------------------------------------------------------------------
    function clearUser() {
        while ($('user').hasChildNodes()) {
            $('user').removeChild($('user').firstChild);
        }
    }

    // ----------------------------------------------------------------------------------
    // $ ist eine kleine Hilfsfunktion.
    // Sie nimmt eine ID und gibt das Element mit dieser ID aus dem Dom zurück.
    // Dadurch erspart man sich das andauernde document.getElementById() getippe.
    // ----------------------------------------------------------------------------------
    function $(id) {
        return document.getElementById(id);
    }

    // ----------------------------------------------------------------------------------
    // createButton nimmt Attribute für einen Button und gibt diesen
    // zusammengesetzt zurück. Dies erspart eine Menge redundaten Code.
    // ----------------------------------------------------------------------------------
    function createButton(id, name, className) {
        let button = document.createElement('BUTTON');
        className ? (button.className = className) : null;
        button.id = id;
        button.innerText = name;
        return button;
    }

    // ----------------------------------------------------------------------------------
    // createDIV nimmt Attribute für eine Div und gibt diese
    // zusammengesetzt zurück. Dies erspart eine Menge redundaten Code.
    // ----------------------------------------------------------------------------------
    function createDIV(id, className) {
        let div = document.createElement('DIV');
        id ? (div.id = id) : null;
        className ? (div.className = className) : null;
        return div;
    }

    // ----------------------------------------------------------------------------------
    // utcTimestampToLocalTime nimmt einen utcTimestamp und gibt das
    // dazugehörigen Datum in lokaler Zeit zurück.
    // ----------------------------------------------------------------------------------
    function utcTimestampToLocalTime(dt) {
        let date = new Date(dt * 1000);
        return date;
    }

    // ----------------------------------------------------------------------------------
    // getSunTime nimmt einen utcTimestamp und gibt das
    // dazugehörigen Datum in lokaler Zeit in Formatierung für
    // die Sonnenauf/-untergangs Komponente zurück.
    // ----------------------------------------------------------------------------------
    function getSunTime(utcTimestamp) {
        let timeObject = utcTimestampToLocalTime(utcTimestamp);

        let hours = timeObject.getHours();
        if (JSON.stringify(hours).length < 2) {
            hours = `0${hours}`;
        }

        let minutes = timeObject.getMinutes();
        if (JSON.stringify(minutes).length < 2) {
            minutes = `0${minutes}`;
        }

        let timeFormatted = `${hours}:${minutes} Uhr`;
        return timeFormatted;
    }

    // ----------------------------------------------------------------------------------
    // getMonthName nimmt ein Zeit Objekt und gibt den dazugehörigen
    // Monat in Deutsch zurück.
    // ----------------------------------------------------------------------------------
    function getMonthName(date) {
        let months = [
            'Januar',
            'Februar',
            'März',
            'April',
            'Mai',
            'Juni',
            'Juli',
            'August',
            'September',
            'Oktober',
            'November',
            'Dezember'
        ];

        return months[date.getMonth()];
    }

    // ----------------------------------------------------------------------------------
    // createTimeFormat nimmt einen utcTimestamp und gibt das
    // dazugehörige Datum in lokaler Zeit in Formatierung für
    // das aktuelle Wetter zurück.
    // außerdem nimmt sie als parameter forecast, welche angibt ob
    // das Wetter im Format für die vorhersage Komponenten
    // zurückgegeben werden soll.
    // ----------------------------------------------------------------------------------
    function createTimeFormat(utcTimestamp, forecast) {
        let timeObject = utcTimestampToLocalTime(utcTimestamp);

        let day = timeObject.getDate();
        let month = getMonthName(timeObject);
        let year = timeObject.getFullYear();

        let hours = timeObject.getHours();
        if (JSON.stringify(hours).length < 2) {
            hours = `0${hours}`;
        }

        let minutes = timeObject.getMinutes();
        if (JSON.stringify(minutes).length < 2) {
            minutes = `0${minutes}`;
        }

        let currentTimeObject = new Date();
        let currentDay = currentTimeObject.getDate();
        if (JSON.stringify(currentDay).length < 2) {
            currentDay = `0${currentDay}`;
        }

        let currentMonth = getMonthName(currentTimeObject);
        let currentYear = timeObject.getFullYear();

        let currentHours = currentTimeObject.getHours();
        if (JSON.stringify(currentHours).length < 2) {
            currentHours = `0${currentHours}`;
        }

        let currentMinutes = currentTimeObject.getMinutes();
        if (JSON.stringify(currentMinutes).length < 2) {
            currentMinutes = `0${currentMinutes}`;
        }

        let timeFormatted;
        if (forecast) {
            timeFormatted = `${hours}:${minutes} Uhr`;
        } else {
            timeFormatted = `${currentDay}. ${currentMonth} ${currentYear}, ${currentHours}:${currentMinutes} Uhr (aktualisiert um ${hours}:${minutes} Uhr)`;
        }
        return timeFormatted;
    }

    // ----------------------------------------------------------------------------------
    // getTemperature nimmt eine Kelvin Temperatur und gibt
    // die konvertierte Celsius Temperatur im korrekten Format mit °C zurück.
    // ----------------------------------------------------------------------------------
    function getTemperature(kelvin) {
        let celsius = kelvinToCelsius(kelvin);
        if (JSON.stringify(celsius).length > 3)
            celsius = JSON.stringify(celsius).substring(0, 4);
        return `${celsius}°C`;
    }

    // kelvin zu Celsius.
    const kelvinToCelsius = kelvin => kelvin - 273.15;

    // ----------------------------------------------------------------------------------
    // windDirectionName nimmt eine Gradzahl für eine Windrichtung und
    // gibt dessen Windrichtung im Kürzelformat zurück.
    // N, O, S, W, ...
    // ----------------------------------------------------------------------------------
    const windDirectionName = degree => {
        let direction = '';
        degree = Number(degree);
        if (degree > 337.5 || degree <= 22.5) {
            direction = 'N';
        } else if (degree > 22.5 && degree <= 67.5) {
            direction = 'NO';
        } else if (degree > 67.5 && degree <= 112.5) {
            direction = 'O';
        } else if (degree > 112.5 && degree <= 157.5) {
            direction = 'SO';
        } else if (degree > 157.5 && degree <= 202.5) {
            direction = 'S';
        } else if (degree > 202.5 && degree <= 247.5) {
            direction = 'SW';
        } else if (degree > 247.5 && degree <= 292.5) {
            direction = 'W';
        } else if (degree > 292.5 && degree <= 337.5) {
            direction = 'NW';
        }
        return direction;
    };

    // ----------------------------------------------------------------------------------
    // checkMutatedVowels nimmt einen String und setzt alle Umlaute ein.
    // ----------------------------------------------------------------------------------
    const checkMutatedVowels = string => {
        string = string.replace(/Ue/g, 'Ü');
        string = string.replace(/ue/g, 'ü');
        string = string.replace(/Ae/g, 'Ä');
        string = string.replace(/ae/g, 'ä');
        string = string.replace(/Oe/g, 'Ö');
        string = string.replace(/oe/g, 'ö');

        return string;
    };

    // ----------------------------------------------------------------------------------
    // getDayName nimmt eine utc Timestamp und gibt dafür den dazugehörigen
    // Wochentag auf Deutsch zurück
    // ----------------------------------------------------------------------------------
    const getDayName = dt => {
        let time = new Date(dt * 1000);
        let day = time.getDay();
        let dayName;

        switch (day) {
            case 0:
                dayName = 'Sonntag';
                break;
            case 1:
                dayName = 'Montag';
                break;
            case 2:
                dayName = 'Dienstag';
                break;
            case 3:
                dayName = 'Mittwoch';
                break;
            case 4:
                dayName = 'Donnerstag';
                break;
            case 5:
                dayName = 'Freitag';
                break;
            case 6:
                dayName = 'Samstag';
                break;
        }

        return dayName;
    };

    // -----------------------------------------------------------------------------------------------------------------------------------------------
    //
    // 3. Geolocation
    //
    // Der Geolocation Part ist dafür zuständig die aktuelle Position
    // abzufragen. Diese wird dann genutzt um das lokale Wetter abzurufen.
    //
    // ----------------------------------------------------------------------------------

    // ----------------------------------------------------------------------------------
    // geolocationPromise erstellt einen Promise für die Abfrage des
    // aktuellen Standortes. Bei Erfolg gibt sie den Standord zurück,
    // und sonst die Fehlermeldung welche gefangen werden kann.
    // ----------------------------------------------------------------------------------
    function geolocationPromise() {
        return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
                pos => {
                    resolve(pos);
                },
                error => {
                    reject(error);
                }
            );
        });
    }

    // ----------------------------------------------------------------------------------
    // getCoordinates fragt den aktuellen Standort ab und gibt daraus nur
    // die Koordiaten zurück und fängt ggf. auftretene Fehler ab.
    // ----------------------------------------------------------------------------------
    async function getCoordinates() {
        try {
            const data = await geolocationPromise();
            let { coords } = data;
            return coords;
        } catch (e) {
            locationError(e);
        }
    }

    // ----------------------------------------------------------------------------------
    // getLonLat holt die aktuellen Koordinaten von getCoordinates
    // und gibt diese zurück
    // ----------------------------------------------------------------------------------
    async function getLonLat() {
        let { longitude, latitude } = await getCoordinates();
        let lonLat = { longitude, latitude };
        return lonLat;
    }

    // ----------------------------------------------------------------------------------
    // locationError differenziert zwischen den möglicherweise auftretenen
    // Fehlern beim Location anfragen und gibt eine entsprechende
    // Fehlermeldung aus.
    // ----------------------------------------------------------------------------------
    function locationError(e) {
        switch (e.code) {
            case e.UNKNOWN_ERROR:
                console.log('geoOutput', 'UNKNOWN_ERROR');
                console.log('geoOutput', 'Error message: ' + e.message);
                break;
            case e.PERMISSION_DENIED:
                console.log('geoOutput', 'PERMISSION_DENIED');
                console.log('geoOutput', 'Error message: ' + e.message);
                break;
            case e.POSITION_UNAVAILABLE:
                console.log('geoOutput', 'POSITION_UNAVAILABLE');
                console.log('geoOutput', 'Error message: ' + e.message);
                break;
            case e.TIMEOUT:
                console.log('geoOutput', 'TIMEOUT');
                console.log('geoOutput', 'Error message: ' + e.message);
                break;
            default:
                console.log('geoOutput', 'Unbekannter Fehlercode');
                console.log('geoOutput', 'Error message: ' + e.message);
                break;
        }
    }

    // -----------------------------------------------------------------------------------------------------------------------------------------------
    //
    // 4. User
    //
    // Der User Part beschäftigt sich mit den Usern.
    // User kümmert sich also um den localStorage und wird wie eine Schnittstelle
    // zu einer Datenbank verwendet.
    //
    // Hier werden Nutzer angelegt, gelöscht und angepasst.
    //
    // ----------------------------------------------------------------------------------

    // ----------------------------------------------------------------------------------
    // loginOrRegisterUser wird gerufen wenn ein Nutzer den Anmelde Button
    // auf der Anmelde Ansicht klickt.
    //
    // Hier wird geprüft ob der Nutzer schon existiert.
    // Wenn dies so ist wird geprüft ob das Passwort richtig ist und er
    // Nutzer ggf. angemeldet.
    //
    // Wenn der Nutzer nicht existiert und die Daten Valide sind, wird ein neuer
    // Nutzer angelegt.
    //
    // Es werden immer die ensprechenden Fehlermeldungen in Form von
    // Alerts angezeigt.
    // ----------------------------------------------------------------------------------
    function loginOrRegisterUser() {
        // holt die Daten aus den Input Feldern
        let name = $('loginNameInput').value;
        let password = $('loginPasswordInput').value;

        // Name und Passwort ungültig?
        if (!checkValidity(name) && !checkValidity(password)) {
            alert('Name und Passwort nicht gültig.');

            // nur Name ungültig?
        } else if (!checkValidity(name)) {
            alert('Name nicht gültig.');

            // nur Passwort ungültig?
        } else if (!checkValidity(password)) {
            alert('Passwort nicht gültig.');

            // Eingaben Valide
        } else {
            // Nutzer existiert?
            if (userExists(name)) {
                // Passwort richtig?
                // --> Dann anmelden
                if (isPasswordCorrect(name, password)) {
                    localStorage.loggedIn = name;

                    // Nutzer zur Homepage bringen.
                    navLink('home');

                    // Passwort falsch
                    // --> Ausgeben
                } else {
                    alert('Passwort ist nicht korrekt!');
                }

                // Nutzer existiert nicht?
            } else {
                // neuen Nutzer erstellen und in den localStorage schreiben
                let storage;
                if (localStorage.storage !== undefined) {
                    storage = JSON.parse(localStorage.storage);
                } else {
                    storage = { users: [] };
                }
                storage.users.push({
                    name: name,
                    password: password,
                    favorites: []
                });
                localStorage.storage = JSON.stringify(storage);
                localStorage.loggedIn = name;

                // schicke die Änderung an alle Clients
                sendChanges();

                // Nutzer zur Homepage bringen.
                navLink('home');
            }
        }
    }

    // prüft ob Name und Passwort mindestens 3 Zeichen lang sind.
    const checkValidity = str => str.length >= 3 && str.length <= 20;

    // ----------------------------------------------------------------------------------
    // userExists nimmt einen Nutzername und prüft ob dieser bereits
    // im localStorage existiert.
    // ----------------------------------------------------------------------------------
    const userExists = name => {
        let exists = false;

        if (localStorage.storage !== undefined) {
            let storage = JSON.parse(localStorage.storage);

            if (storage.users !== undefined) {
                storage.users.forEach(user => {
                    if (user.name === name) {
                        exists = true;
                    }
                });
            }
        }
        return exists;
    };

    // ----------------------------------------------------------------------------------
    // isPasswortCorrect nimmt einen Nutzernamen und ein Passwort und prüft ob das
    // Passwort zu dem Account korrekt ist.
    // ----------------------------------------------------------------------------------
    const isPasswordCorrect = (name, password) => {
        let correct = false;

        if (localStorage.storage !== undefined) {
            let storage = JSON.parse(localStorage.storage);
            for (let i = 0; i < storage.users.length && !correct; i++) {
                if (
                    storage.users[i].name === name &&
                    storage.users[i].password === password
                ) {
                    correct = true;
                }
            }
        }
        return correct;
    };

    // gibt zurück ob ein Nutzer angemeldet ist
    function loggedIn() {
        return (
            localStorage.loggedIn !== 'notLoggedIn' &&
            localStorage.hasOwnProperty('loggedIn')
        );
    }

    // gibt den aktuell angemeldeten Nutzer zurück
    function getCurrentUser() {
        let storage = JSON.parse(localStorage.storage);
        let currentUser = storage.users.find(
            user => user.name === localStorage.loggedIn
        );
        return currentUser;
    }

    // ----------------------------------------------------------------------------------
    // updateUser wird durch den aktualisieren Button in der Account Einstellungsansicht
    // gerufen. Sie prüft ob die Änderungen möglich sind und führt sie
    // ggf. durch.
    // ----------------------------------------------------------------------------------
    const updateUser = () => {
        // holt den aktuell angemeldeten Nutzer
        let currentUser = getCurrentUser();

        // holt die Daten aus den Input Feldern
        let name = $('loginNameInput').value;
        let password = $('loginPasswordInput').value;

        // Name und Passwort ungültig?
        if (!checkValidity(name) && !checkValidity(password)) {
            alert('Name und Passwort nicht gültig.');

            // nur Name ungültig?
        } else if (!checkValidity(name)) {
            alert('Name nicht gültig.');

            // nur Passwort ungültig?
        } else if (!checkValidity(password)) {
            alert('Passwort nicht gültig.');

            // Eingaben Valide
        } else {
            // Nutzer existiert aber entspricht nicht dem angemeldetem Nutzer
            if (userExists(name) && name !== currentUser.name) {
                alert('Nutzername bereits in verwendung.');

                // Nutzer und Password unverändert
            } else if (
                name === currentUser.name &&
                password === currentUser.password
            ) {
                alert('Nichts geändert.');
                navLink('home');

                // Passwort und/oder Namen geändert und möglich
            } else {
                let storage;
                if (localStorage.storage !== undefined) {
                    storage = JSON.parse(localStorage.storage);
                } else {
                    storage = { users: [] };
                }

                storage.users.push({
                    name: name,
                    password: password,
                    favorites: currentUser.favorites
                });

                let deleted = false;
                if (name !== currentUser.name) {
                    // Geht durch alle User vom Storage und löscht den alten Namen
                    for (let i = 0; i < storage.users.length && !deleted; i++) {
                        if (storage.users[i].name === currentUser.name) {
                            storage.users.splice(i, 1);
                            deleted = true;
                        }
                    }
                }

                console.log(storage);

                // aktualisiert den Nutzer
                localStorage.storage = JSON.stringify(storage);
                localStorage.loggedIn = name;
                alert('Nutzer aktualisiert.');

                // verschickt die Änderung über den Websocket an alle Clients
                sendChanges();

                // lade die Homepage
                navLink('home');
            }
        }
    };

    // ----------------------------------------------------------------------------------
    // checkFavExists nimmt eine Stadt ID und prüft ob der aktuell angemeldete
    // Nutzer die Stadt bereits als Favoriten hinzugefügt an und
    // fügt diese sonst den Favoriten hinzu.
    // ----------------------------------------------------------------------------------
    function checkFavExists(id) {
        if (
            localStorage.storage !== undefined &&
            localStorage.loggedIn !== undefined
        ) {
            let storage = JSON.parse(localStorage.storage);
            let currentUser = storage.users.find(
                user => user.name == localStorage.loggedIn
            );

            let exists = false;

            // existiert die Stadt unter den Favoriten?
            for (let i = 0; i < currentUser.favorites.length && !exists; i++) {
                if (currentUser.favorites[i] === id) {
                    exists = true;
                }
            }

            // Existiert nicht
            if (exists === false) {
                if (id !== undefined) {
                    // Favorit hinzufügen
                    currentUser.favorites.push(id);
                }
                storage.users[localStorage.loggedIn] = currentUser;
                localStorage.storage = JSON.stringify(storage);

                // Änderung an alle Clients durch den Websocket schicken.
                sendChanges();
            }
        }
    }

    // ----------------------------------------------------------------------------------
    // removeFavorite nimmt eine Stadt ID und prüft ob diese
    // in den Favoriten vom angemeldeten Nutzer ist.
    //
    // Wenn sie dies ist, wird sie daraus entfernt.
    // ----------------------------------------------------------------------------------
    function removeFavorite(id) {
        if (
            localStorage.storage !== undefined &&
            localStorage.loggedIn !== undefined
        ) {
            let storage = JSON.parse(localStorage.storage);
            let currentUser = storage.users.find(
                user => user.name == localStorage.loggedIn
            );
            let deleted = false;

            // Geht durch alle Favoriten vom Nutzer und guckt ob die Stadt dabei ist
            for (let i = 0; i < currentUser.favorites.length && !deleted; i++) {
                if (currentUser.favorites[i] === id) {
                    currentUser.favorites.splice(i, 1);
                    deleted = true;
                }
            }
            storage.users[localStorage.loggedIn] = currentUser;
            localStorage.storage = JSON.stringify(storage);
        }

        // Benachrichtigt alle Clients über die Veränderung
        sendChanges();
    }

    // -----------------------------------------------------------------------------------------------------------------------------------------------
    //
    // 5. Wetter
    //
    // Der Wetter Part ist dafür zuständig, anfragen an die OpenWeather Api zu stellen.
    // Hier werden anfragen an dessen Endpunkte gestellt und
    // entsprechende Hilfsfunktionen gestellt.
    //
    // ----------------------------------------------------------------------------------

    // mein API-Key
    const apiKey = '3bac5b8af1f13d46c2f314016915cc83';

    // erstellt eine Anfrage URL aus übergebenen Koordinaten
    async function createWeatherCoordinateLink(long, lat) {
        let { latitude, longitude } = await getLonLat();
        if (lat && long) {
            latitude = lat;
            longitude = long;
        }
        let link = `http://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}&lang=de`;
        return link;
    }

    // erstellt eine Anfrage URL aus einer übergebenen StadtID
    async function createWeatherCityIdLink(id) {
        let link = `http://api.openweathermap.org/data/2.5/weather?id=${id}&appid=${apiKey}&lang=de`;
        return link;
    }

    // erstellt eine Anfrage URL aus einer übergebenen Postleitzahl und einem Ländercode
    async function createWeatherCityPostalCodeLink(zip, countryCode) {
        let link = `http://api.openweathermap.org/data/2.5/weather?zip=${zip},${countryCode}&appid=${apiKey}&lang=de`;
        return link;
    }

    // erstellt eine Anfrage URL aus einem übergebenen Stadtnamen
    async function createWeatherCityNameLink(name) {
        let link = `http://api.openweathermap.org/data/2.5/weather?q=${name}&appid=${apiKey}&lang=de`;
        return link;
    }

    // erstellt eine Anfrage URL aus einer übergebenen StadtID für Vorhersagen
    async function createWeatherForecastCityNameLink(name) {
        let link = `http://api.openweathermap.org/data/2.5/forecast?q=${name}&appid=${apiKey}&lang=de`;
        return link;
    }

    // ----------------------------------------------------------------------------------
    // getCurrentWeather holt die aktuellen Wetterdaten für die aktuelle Position
    // Es wird automatisch eine Anfrage für eine Stadt ID gemacht, wenn eine ID
    // übergeben wird.
    // ----------------------------------------------------------------------------------
    async function getCurrentWeather(id) {
        let currentWeatherURL;

        if (id) {
            // Wetter durch Stadt ID
            currentWeatherURL = await createWeatherCityIdLink(id);
        } else {
            // Wetter durch Koordinaten
            currentWeatherURL = await createWeatherCoordinateLink();
        }

        // Fragt Daten ab
        let weather = await fetch(currentWeatherURL);
        weather = await weather.json();

        // Liest die img URL aus
        let iconName = await weather.weather[0].icon;
        let img = `http://openweathermap.org/img/w/${iconName}.png`;

        // gibt das Wetter und das Bild in einem Objekt zurück
        let currentWeather = { weather, img };
        return currentWeather;
    }

    // ----------------------------------------------------------------------------------
    // fetchWeatherForecast fragt die Wettervorhersagedaten von OpenWeather an
    // und gibt diese zurück.
    // ----------------------------------------------------------------------------------
    async function fetchWeatherForecast(cityName) {
        let weatherURL = await createWeatherForecastCityNameLink(cityName);
        let weather = await fetch(weatherURL);
        weather = await weather.json();

        return weather;
    }

    // ----------------------------------------------------------------------------------
    // getCityIDforName nimmt einen Stadtnamen und gibt die dazugehörige ID zurück
    // ----------------------------------------------------------------------------------
    async function getCityIDforName(cityName) {
        let weatherURL;

        weatherURL = await createWeatherCityNameLink(cityName);

        let weather = await fetch(weatherURL);
        weather = await weather.json();

        return weather.id;
    }

    // -----------------------------------------------------------------------------------------------------------------------------------------------
    //
    // 6. Login Card
    //
    // Die Login Kachel ist ein Custom Element das für die Anmeldung und für
    // die Benutzereinstellung verwendet wird.
    // Es besteht aus 2 Inputs und einem Submit Button, über den die
    // entsprechende Funktion gerufen wird.
    //
    // Grundsätzlich wird eine Anmeldekachel erzeugt, außer der Konstruktor erhält
    // einen Boolean der Wahr ist. Dann wird eine Einstellungskachel erzeugt.
    //
    // ----------------------------------------------------------------------------------
    class LoginCard extends HTMLElement {
        constructor(settings) {
            super();

            this.currentUser;

            // Settings?
            // --> Einstellungskachel
            if (settings) {
                this.currentUser = getCurrentUser();
                this.settings = true;
            } else {
                this.settings = false;
            }
        }

        connectedCallback() {
            // hauptDiv
            this.loginContainer = createDIV('loginContainer');
            this.loginInputsContainer = createDIV('loginInputsContainer');

            // linke Div für die Labels
            this.loginLeft = createDIV('loginLeft');

            // label für den ersten Input
            this.loginNameText = createDIV('loginNameText');
            this.loginNameText.innerText = this.settings
                ? 'Neuer Name'
                : 'Name:';

            // label für den zweiten Input
            this.loginPasswordText = createDIV('loginPasswordText');
            this.loginPasswordText.innerText = this.settings
                ? 'Neues Passwort'
                : 'Passwort:';

            // rechte Div für die Inputs
            this.loginRight = createDIV('loginRight');

            // div für den Nutzernamen Input
            this.loginNameInputContainer = createDIV('loginNameInputContainer');

            // input für den Nutzernamen
            this.loginNameInput = document.createElement('INPUT');
            this.loginNameInput.id = 'loginNameInput';
            this.loginNameInput.type = 'text';
            this.loginNameInput.minlength = '3';
            this.loginNameInput.maxlength = '20';
            this.loginNameInput.value = this.settings
                ? this.currentUser.name
                : 'Bob';

            // div für das Passwort Input
            this.loginPasswordInputContainer = createDIV(
                'loginPasswordInputContainer'
            );

            // input für das Passwort
            this.loginPasswordInput = document.createElement('INPUT');
            this.loginPasswordInput.id = 'loginPasswordInput';
            this.loginPasswordInput.type = 'password';
            this.loginPasswordInput.minlength = '3';
            this.loginPasswordInput.maxlength = '20';
            this.loginPasswordInput.value = this.settings
                ? this.currentUser.password
                : 'bob';
            this.loginPasswordInput.addEventListener('keyup', event => {
                if (event.keyCode === 13) {
                    event.preventDefault();
                    $('loginButton').click();
                }
            });

            // Button Container
            this.loginButtonContainer = createDIV('loginButtonContainer');

            // eigentiche Button
            this.loginButton = document.createElement('INPUT');
            this.loginButton.id = 'loginButton';
            this.loginButton.type = 'button';
            this.loginButton.value = this.settings
                ? 'Aktualisieren'
                : 'Anmelden und ggf. Registrieren';

            // On Click Event je nach Kachelart
            if (this.settings) {
                this.loginButton.addEventListener('click', updateUser);
            } else {
                this.loginButton.addEventListener('click', loginOrRegisterUser);
            }

            // Einmal alles zusammensetzen
            this.loginLeft.append(this.loginNameText);
            this.loginLeft.append(this.loginPasswordText);
            this.loginInputsContainer.append(this.loginLeft);
            this.loginNameInputContainer.append(this.loginNameInput);
            this.loginRight.append(this.loginNameInputContainer);
            this.loginPasswordInputContainer.append(this.loginPasswordInput);
            this.loginRight.append(this.loginPasswordInputContainer);
            this.loginInputsContainer.append(this.loginRight);
            this.loginButtonContainer.append(this.loginButton);
            this.loginContainer.append(this.loginInputsContainer);
            this.loginContainer.append(this.loginButtonContainer);
            this.append(this.loginContainer);
        }
    }

    // Das Custom Element dem Window bekannt machen.
    window.customElements.define('login-card', LoginCard);

    // -----------------------------------------------------------------------------------------------------------------------------------------------
    //
    // 7. Aktuelle Wetter
    //
    // Aktuelle Wetter dient dazu die Kachel für den aktuellen Tag darzustellen.
    //
    // Die Wetterkachel kann auf 3 Arten aufgerufen werden:
    //  1. mit keinen Parametern
    //      ohne Parameter wird die Kachel mit der aktuellen Position erzeugt
    //  2. mit einer Stadt Id
    //      dann werden die Daten von der Stadt geholt und die Kachel damit erstellt
    //  3. mit Wetterdaten, Bild und einem Boolean ob es das letzte Element ist
    //      dann wird die Kachel für die Vorhersageübersicht als eine der
    //      3 Stundenblöcke verwendet.
    //
    // Je nachdem welche Paramter die Funktion bekommt werden Teile unterschiedlich
    // verarbeitet.
    //
    // ----------------------------------------------------------------------------------

    async function createCurrentWeatherCard(
        id,
        weatherInput,
        imgInput,
        lastElement
    ) {
        let weather;
        let img;

        // kein Wetterinput, Daten anfragen von Wetter (siehe 5. Wetter)
        if (weatherInput === undefined) {
            let data = await getCurrentWeather(id);
            weather = data.weather;
            img = data.img;

            // Stadt zu den Favoriten hinzufügen
            checkFavExists(weather.id);

            // sonst die übergebenen Wetterdaten nutzen
        } else {
            weather = weatherInput;
            img = imgInput;
        }

        // Haupt Container
        let container = createDIV('currentWeatherContainer');
        if (weatherInput !== undefined) {
            container.id = 'weatherOverviewContainer';
        }
        if (lastElement !== undefined) {
            container.id = 'lastWeatherOverviewContainer';
        }

        // Header
        // --> wird nicht angezeigt in der Vorhersage
        let currentWeatherHeader;
        if (weatherInput === undefined) {
            // Header
            currentWeatherHeader = createDIV('currentWeatherHeader');
            currentWeatherHeader.innerText = checkMutatedVowels(weather.name);
        }

        // Zeit
        let currentWeatherCreationTime = createDIV(
            'currentWeatherCreationTime'
        );
        let time = createTimeFormat(weather.dt, weatherInput !== undefined);
        if (weatherInput !== undefined) {
            currentWeatherCreationTime.id = 'weatherOverviewTime';
        }
        currentWeatherCreationTime.innerHTML = time;

        // Container für Details
        let currentWeatherEssentials = createDIV('currentWeatherEssentials');

        // Linke Hälfte im Detailcontainer
        let currentWeatherInformationContainer = createDIV(
            'currentWeatherInformationContainer'
        );

        // Temperatur
        let currentWeatherTemperature = createDIV('currentWeatherTemperature');
        if (weatherInput !== undefined) {
            currentWeatherTemperature.id = 'weatherOverviewTemperature';
        }

        // Temperatur formatieren lassen
        let temperature = getTemperature(weather.main.temp);
        currentWeatherTemperature.innerText = temperature;

        // Regen
        // --> Regnet es?
        let rainIcon = false;
        let rain = '';

        // Prüft ob eines der Arrayfelder in Regen befüllt ist
        if (weather.rain != null) {
            if ('1h' in weather.rain) {
                rain = `${weather.rain['1h']} mm / h`;
                rainIcon = true;
            } else if ('3h' in weather.rain) {
                rain = `${weather.rain['3h']} mm / 3h`;
                rainIcon = true;
            }
        }

        // Regen Container
        let currentWeatherRain = createDIV('currentWeatherRain');

        // Regen Icon
        // --> Wird nur angezeigt wenn es regnet
        let currentWeatherRainIcon = document.createElement('I');
        currentWeatherRainIcon.className = rainIcon ? 'fas fa-umbrella' : '';
        currentWeatherRainIcon.id = 'currentWeatherWindIcon';

        // Regen Text
        let currentWeatherRainContent = createDIV('currentWeatherRainContent');
        currentWeatherRainContent.innerText = rain;

        // Luftdruck
        let currentWeatherAirPressure = createDIV('currentWeatherAirPressure');
        currentWeatherAirPressure.innerText = weather.main.pressure
            ? `${weather.main.pressure} hPa`
            : '';

        // Wind
        let currentWeatherWindContainer = createDIV(
            'currentWeatherWindContainer'
        );

        let currentWeatherWindChild = createDIV('currentWeatherWindChild');

        // Wind Icon
        let currentWeatherWindIcon = document.createElement('I');
        currentWeatherWindIcon.id = 'currentWeatherWindIcon';
        currentWeatherWindIcon.className = 'fas fa-wind';

        // Windgeschwindigkeit
        let currentWeatherWindText = createDIV('currentWeatherWindText');
        currentWeatherWindText = `${weather.wind.speed} m/s`;

        // Windrichtung
        let currentWeatherWindDirection = createDIV(
            'currentWeatherWindDirection'
        );
        let currentWeatherWindDirectionName = createDIV(
            'currentWeatherWindDirectionName'
        );

        // --> Konvertiert Windgrad in Kürzel
        currentWeatherWindDirectionName.innerText =
            weather.wind.deg !== undefined
                ? windDirectionName(weather.wind.deg)
                : '';

        // Windpfeil
        let currentWeatherWindArrow = document.createElement('I');
        currentWeatherWindArrow.id = 'currentWeatherWindArrow';
        currentWeatherWindArrow.className =
            weather.wind.deg !== undefined ? 'fas fa-directions' : '';

        // Sonne
        let currentWeatherSun = createDIV('currentWeatherSun');

        // Sonnenaufgang
        let currentWeatherSunrise = createDIV('currentWeatherSunrise');

        // Sonnenaufgang - Bild
        let currentWeatherSunriseIMG = document.createElement('IMG');
        currentWeatherSunriseIMG.id = 'currentWeatherSunriseIMG';
        currentWeatherSunriseIMG.src =
            'https://img.icons8.com/color/96/000000/sunrise.png';

        // Sonnenaufgang - Text
        let currentWeatherSunriseTime = createDIV('currentWeatherSunriseTime');
        currentWeatherSunriseTime.innerText = getSunTime(weather.sys.sunrise);

        // Sonnenuntergang
        let currentWeatherSunset = createDIV('currentWeatherSunset');

        // Sonnenuntergang - Bild
        let currentWeatherSunsetIMG = document.createElement('IMG');
        currentWeatherSunsetIMG.id = 'currentWeatherSunsetIMG';
        currentWeatherSunsetIMG.src =
            'https://img.icons8.com/color/96/000000/sunset.png';

        // Sonnenuntergang - Text
        let currentWeatherSunsetTime = createDIV('currentWeatherSunsetTime');
        currentWeatherSunsetTime.innerText = getSunTime(weather.sys.sunset);

        // Rechte Seite - Wetter Icon und Beschreibung
        let currentWeatherImgContainer = createDIV(
            'currentWeatherImgContainer'
        );
        if (weatherInput !== undefined) {
            currentWeatherImgContainer.id = 'weatherOverviewImgContainer';
        }

        // Wetterbeschreibung
        let currentWeatherOvercast = createDIV('currentWeatherOvercast');
        let description = weather.weather[0].description;
        currentWeatherOvercast.innerText = `${description}`;

        // Wetter Icon
        let currentWeatherIMG = document.createElement('IMG');
        currentWeatherIMG.id = 'currentWeatherIMG';
        currentWeatherIMG.src = img;

        // Alles zusammensetzen

        // links
        // Daten die nur angezeigt werden sollen wenn es nicht für die Vorhersage ist
        if (weatherInput === undefined) {
            currentWeatherSunrise.append(currentWeatherSunriseIMG);
            currentWeatherSunrise.append(currentWeatherSunriseTime);
            currentWeatherSun.append(currentWeatherSunrise);
            currentWeatherSunset.append(currentWeatherSunsetIMG);
            currentWeatherSunset.append(currentWeatherSunsetTime);
            currentWeatherSun.append(currentWeatherSunset);
        }
        currentWeatherWindDirection.append(currentWeatherWindDirectionName);
        currentWeatherWindDirection.append(currentWeatherWindArrow);
        currentWeatherWindChild.append(currentWeatherWindIcon);
        currentWeatherWindChild.append(currentWeatherWindText);
        currentWeatherWindContainer.append(currentWeatherWindChild);
        currentWeatherWindContainer.append(currentWeatherWindDirection);
        currentWeatherRain.append(currentWeatherRainIcon);
        currentWeatherRain.append(currentWeatherRainContent);
        currentWeatherInformationContainer.append(currentWeatherTemperature);
        currentWeatherInformationContainer.append(currentWeatherRain);
        currentWeatherInformationContainer.append(currentWeatherAirPressure);
        currentWeatherInformationContainer.append(currentWeatherWindContainer);
        if (weatherInput === undefined) {
            currentWeatherInformationContainer.append(currentWeatherSun);
        }
        currentWeatherEssentials.append(currentWeatherInformationContainer);

        // rechts
        currentWeatherImgContainer.append(currentWeatherOvercast);
        currentWeatherImgContainer.append(currentWeatherIMG);
        currentWeatherEssentials.append(currentWeatherImgContainer);

        // hauptContainer
        if (weatherInput === undefined) {
            container.append(currentWeatherHeader);
        }
        container.append(currentWeatherCreationTime);
        container.append(currentWeatherEssentials);
        if (weatherInput === undefined) {
            $('contentContainer').appendChild(container);
        } else {
            return container;
        }
    }

    // -----------------------------------------------------------------------------------------------------------------------------------------------
    //
    // 8. Wettervorhersage
    //
    // Die Wettervorhersage zeigt eine Übersicht der nächsten 5 Tage an.
    //
    // Für jeden Tag wird ein Diagramm der Zeit und für alle 3 Stunden eine
    // Übersicht angezeigt. Wenn man auf die Übersicht klickt fährt sie aus,
    // und zeigt mehr Informationen.
    //
    // ----------------------------------------------------------------------------------

    // ----------------------------------------------------------------------------------
    // createWeatherForecast bekommt einen Stadtnamen und erzeugt dazu eine
    // Wettervorhersage.
    //
    // Dazu werden die Daten für die Vorhersage von der Api geholt.
    // Diese wird dann in Tage unterteilt.
    //
    // Mit der Liste der Tage wird eine Funktion gerufen die daraus
    // die Tagesansichten erstellt.
    // ----------------------------------------------------------------------------------
    const createWeatherForecast = async cityName => {
        $('currentWeatherContainer').remove();
        let weather = await fetchWeatherForecast(cityName);
        console.log(weather);
        // main Container
        let container = createDIV('forecastWeatherContainer');

        // Header
        let headerContainer = createForecastHeader(weather.city.name);
        container.append(headerContainer);

        // Forecast List
        let forecastList = createForecastList(weather);
        container.append(forecastList);

        // APPEND TO MAIN CONTAIforecastListNER
        $('contentContainer').append(container);
    };

    // ----------------------------------------------------------------------------------
    // createForecastList nimmt das Vorhersage Objekt von der Api
    // und macht daraus ein Array aus Tagen.
    //
    // Für jeden Tag wird dann eine Tagesansicht generiert.
    // ----------------------------------------------------------------------------------
    const createForecastList = weather => {
        let forecastListContainer = createDIV('forecastListContainer');

        // teilt das Wetterobjekt in Tage auf
        let days = getDays(weather.list);

        // erstellt für jeden Tag eine Ansicht
        days.forEach(day => {
            forecastListContainer = createForecastDay(
                forecastListContainer,
                day
            );
        });

        return forecastListContainer;
    };

    const createForecastHeader = cityName => {
        let headerContainer = createDIV('forecastMainHeaderContainer');

        let currentTimeObject = new Date();
        let currentDay = currentTimeObject.getDate();
        let currentMonth = getMonthName(currentTimeObject);
        let currentYear = currentTimeObject.getFullYear();

        let currentHours = currentTimeObject.getHours();
        if (JSON.stringify(currentHours).length < 2) {
            currentHours = `0${currentHours}`;
        }

        let currentMinutes = currentTimeObject.getMinutes();
        if (JSON.stringify(currentMinutes).length < 2) {
            currentMinutes = `0${currentMinutes}`;
        }

        let timeFormatted = `${currentDay}. ${currentMonth} ${currentYear}, ${currentHours}:${currentMinutes} Uhr `;

        let mainHeader = createDIV('forecastMainHeader');
        let mainHeaderTitle = createDIV('forecastMainHeaderTitle');
        mainHeaderTitle.innerText = checkMutatedVowels(cityName);
        let mainHeaderTime = createDIV('forecastMainHeaderTime');
        mainHeaderTime.innerText = timeFormatted;

        mainHeader.append(mainHeaderTitle);
        mainHeader.append(mainHeaderTime);

        headerContainer.append(mainHeader);
        return headerContainer;
    };

    // ----------------------------------------------------------------------------------
    // getDays nimmt eine die Stundenwetter Liste aus dem Wetterobjekt
    // der Api und erstellt daraus ein Array aus Tagen.
    //
    // Dafür wird immer geprüft ob ein Eintrag nach vom gleichen Tag wie der
    // vorherige Eintrag ist.
    // Sonst wird ein neuer Tag damit gestartet.
    // ----------------------------------------------------------------------------------
    const getDays = list => {
        // erster Tag als Ausgangspunkt
        let currentDay = new Date(list[0].dt * 1000).getDay();

        let days = [];
        let day = [];

        // nimmt jeden Eintrag und ordnet ihm einen Tag zu
        list.forEach((item, index) => {
            let time = new Date(item.dt * 1000);

            // entspricht der Tag dem letzem Eintrag?
            if (time.getDay() === currentDay) {
                // Dann füg ihn dem aktuellen Tag hinzu
                day.push(item);

                // ansonsten erstelle einen neuen Tag
                // und füge ihn dort hinzu
            } else {
                currentDay = time.getDay();
                days.push(day);
                day = [];
                day.push(item);
            }

            // Prüft ob ein nächstes Element existiert
            if (!list[index + 1] && day.length > 0) {
                days.push(day);
            }
        });

        return days;
    };

    // ----------------------------------------------------------------------------------
    // createForecastDay nimmt einen einzelnen Tag und zeigt dafür eine Übersicht an.
    // Diese besteht aus:
    //  1. Diagramm
    //      Einem Balkendiagramm das die Temperatur für den gesamten Tag zeigt
    //  2. drei-Stunden
    //      Für jede 3. Stunde vom Tag wird eine kleine Übersicht
    //      Wenn auf die Übersicht geklickt wird,
    //      fährt sie aus und zeigt deutlich mehr Informationen
    // ----------------------------------------------------------------------------------
    const createForecastDay = (parent, day) => {
        let state = false;
        let dayContainer = createDIV(null, 'dayContainer');
        dayContainer.addEventListener('click', async event => {
            let element = event.target;
            let name = element.className;

            while (name !== undefined && name !== 'dayContainer') {
                element = element.parentNode;
                name = element.className;
            }

            while (element.childNodes.length > 1) {
                element.removeChild(element.lastChild);
            }
            if (state) {
                element.append(createDayOverview(day));
                state = !state;
            } else if (!state) {
                element.append(await createDetailedDay(day));
                state = !state;
            }
        });

        dayContainer.append(createDayHeader(day[0].dt));
        dayContainer.append(createDayOverview(day));

        parent.append(dayContainer);
        return parent;
    };

    // ----------------------------------------------------------------------------------
    // createDayHeader erzeugt den Header für jede Tagesübersicht
    // je nach Tag zeigt sie Heute, Morgen, oder den Wochentag an.
    // ----------------------------------------------------------------------------------
    const createDayHeader = dt => {
        let dayHeader = createDIV(null, 'dayHeader');
        let today = new Date().getDay();
        let dayDay = new Date(dt * 1000).getDay();

        // ist der Tag heute?
        if (today === dayDay) {
            dayHeader.innerText = 'Heute';

            // ist der Tag morgen?
        } else if (dayDay === today + 1 || (today === 6 && dayDay === 0)) {
            dayHeader.innerText = 'Morgen';

            // sonst den Tagesnamen holen
        } else {
            dayHeader.innerText = getDayName(dt);
        }
        return dayHeader;
    };

    // ----------------------------------------------------------------------------------
    // createDayOverview wird gerufen um eine Tagesvorhersage zu erzeugen.
    // Diese zeigt weniger Information als die Detailansicht, ist aber dafür
    // kompakter und man sieht mehr Tage auf einmal.
    //
    // Sie zeigt Temperatur, Regen, Wetterbeschreibung und das Wettericon an.
    //
    // Sie zeigt Standardmäßig die 14 Uhr Informationen an.
    // ----------------------------------------------------------------------------------
    const createDayOverview = day => {
        // Container für den Tag
        let dayOverviewContainer = createDIV(null, 'dayOverviewContainer');

        let hour;

        // Tagesstunde vom übergebenen Tag holen
        if (day[3] !== undefined) {
            hour = day[3];
        } else {
            hour = day[0];
        }

        // Linke Seite

        // Temperatur
        let dayOverviewTemperature = createDIV(null, 'dayOverviewTemperature');
        dayOverviewTemperature.innerText = getTemperature(hour.main.temp);

        // Regnet es?
        let rainIcon = false;
        let rain = '';

        if (hour.rain != null) {
            if ('1h' in hour.rain) {
                rain = `${hour.rain['1h']} mm / h`;
                rainIcon = true;
            } else if ('3h' in hour.rain) {
                rain = `${hour.rain['3h']} mm / 3h`;
                rainIcon = true;
            }
        }

        let dayOverviewRain = createDIV(null, 'dayOverviewRain');

        // Regen Icon
        let dayOverviewRainIcon = document.createElement('I');
        dayOverviewRainIcon.className = rainIcon ? 'fas fa-umbrella' : '';
        dayOverviewRainIcon.id = 'currentWeatherWindIcon';

        // Regen Text
        let dayOverviewRainContent = createDIV(null, 'dayOverviewRainContent');
        dayOverviewRainContent.innerText = rain;

        dayOverviewRain.append(dayOverviewRainIcon);
        dayOverviewRain.append(dayOverviewRainContent);

        let dayOverviewLeft = createDIV(null, 'dayOverviewLeft');
        dayOverviewLeft.append(dayOverviewTemperature);
        dayOverviewLeft.append(dayOverviewRain);
        dayOverviewContainer.append(dayOverviewLeft);

        // Rechte Seite

        // Beschreibung
        let dayOverviewOvercast = createDIV('dayOverviewOvercast');
        let description = hour.weather[0].description;
        dayOverviewOvercast.innerText = `${description}`;

        // Wetter Icon
        let iconName = hour.weather[0].icon;
        let img = `http://openweathermap.org/img/w/${iconName}.png`;

        let dayOverviewIMGContainer = createDIV(
            null,
            'dayOverviewIMGContainer'
        );
        let dayOverviewIMG = document.createElement('IMG');
        dayOverviewIMG.id = 'dayOverviewIMG';
        dayOverviewIMG.src = img;
        dayOverviewIMGContainer.append(dayOverviewIMG);

        let dayOverviewRight = createDIV(null, 'dayOverviewRight');
        dayOverviewRight.append(dayOverviewOvercast);
        dayOverviewRight.append(dayOverviewIMGContainer);
        dayOverviewContainer.append(dayOverviewRight);

        return dayOverviewContainer;
    };

    // ----------------------------------------------------------------------------------
    // createDetailedDay erzeugt für einen Tag eine genaue Ansicht
    //
    // Es wird für den Tag ein Diagramm erzeugt, welches das Custom Element
    // ForecastChart verwendet (siehe 9. Diagramm).
    //
    // Außerdem wird für jede dritte Stunde eine detaillierte Ansicht erzeugt.
    // Dazu wird die aktuelle Wetterkachel verwendet.
    // ----------------------------------------------------------------------------------
    const createDetailedDay = async day => {
        let detailedDayContainer = createDIV(null, 'detailedDayContainer');

        // erstellt ein Diagramm für den Tag
        detailedDayContainer.append(new ForecastChart(day));

        // erstellt Detailansicht für jede dritte Stunde
        detailedDayContainer = await createForecastHours(
            detailedDayContainer,
            day
        );

        return detailedDayContainer;
    };

    // ----------------------------------------------------------------------------------
    // createForecastHours nimmt einen Tag und erzeugt für jede Stunde
    // daraus eine aktuelle Wetterkachel mit dem Wetter aus der Stunde.
    // ----------------------------------------------------------------------------------
    const createForecastHours = (dayContainer, day) => {
        // iteriert durch die Stunden
        day.forEach(async (hour, i) => {
            let iconName = hour.weather[0].icon;
            let img = `http://openweathermap.org/img/w/${iconName}.png`;
            let hourContainer;

            // Letzte Stunde kriegt einen Wahren Boolean mit damit keine
            // Border erzeugt wird.
            if (i === day.length - 1) {
                hourContainer = await createCurrentWeatherCard(
                    null,
                    hour,
                    img,
                    true
                );
            } else {
                hourContainer = await createCurrentWeatherCard(null, hour, img);
            }
            dayContainer.append(hourContainer);
        });

        return dayContainer;
    };

    // Kriegt einen utc Timestamp und gibt die Stunde dazu zurück
    const getHour = dt => {
        let time = new Date(dt * 1000);
        let hour = time.getHours;
        return hour.length < 2 ? hour + '0' : hour;
    };

    // -----------------------------------------------------------------------------------------------------------------------------------------------
    //
    // 9. Diagramm
    //
    // Das Diagramm ist ein Custom Element welches Temperatur und Stunden von einem
    // Tag bekommt und daraus ein Diagramm erzeugt.
    //
    // Es ist ein Balkendiagramm, welches durch 3 Funktionen erzeugt wird:
    //  1. createBars
    //      erzeugt die einzelnen Temperaturbalken
    //  2. createTempAxis
    //      erzeugt die Temperaturbeschriftung an der Y-Achse
    //  3. createHourAxis
    //      erzeugt die Zeitbeschriftung an der X-Achse
    //
    // ----------------------------------------------------------------------------------
    class ForecastChart extends HTMLElement {
        constructor(day) {
            super();
            this.day = day;
        }

        connectedCallback() {
            this.chartContainer = createDIV(null, 'chartContainer');
            this.top = createDIV(null, 'top');
            this.yWrap = createDIV(null, 'yWrap');
            this.yAxis = createDIV(null, 'yAxis');
            this.chart = createDIV(null, 'chart');
            this.xAxis = createDIV(null, 'xAxis');

            // Variablen für die einheitliche Skalierung
            this.hours = [];
            this.maxTemp = -1000;
            this.minTemp = 1000;
            this.topPuffer = 20;

            // erstellt aus allen Stunden ein Array bestehend aus den
            // wesentlichne Daten fürs Diagramm
            this.day.map(hour => {
                // runde die Temperatur
                // --> Y-Achse
                this.temperature = Math.ceil(hour.main.temp - 273.15);

                // erstell ein Zeitobjekt
                this.timeObject = new Date(hour.dt * 1000);

                // hol die Stunde aus dem Zeitobjekt
                // --> X-Achse
                this.time = this.timeObject.getHours();

                // push die Werte in das Stundenarray
                this.hours.push({
                    time: this.time,
                    temperature: this.temperature
                });
            });

            // gehe durch alle Stunden um finde die maximale und die minimale Temperatur heraus
            this.hours.forEach(hour => {
                if (hour.temperature > this.maxTemp) {
                    this.maxTemp = hour.temperature;
                }
                if (hour.temperature < this.minTemp) {
                    this.minTemp = hour.temperature;
                }
            });

            // mehr Variablen um eine einheitliche Skalierung zu ermöglichen
            // --> Platz für X- und Y-Achsen schaffen
            this.widthOffset = 100;
            this.textOffset = 50;

            // Aktuelle Breite von dem VorhersageContainer holen
            this.width =
                $('forecastListContainer').offsetWidth - this.widthOffset;

            // Das Diagramm ist immer halb so hoch wie breit
            this.height = this.width / 2 - this.textOffset;

            // Schrittweite für X-Achse berechnen
            this.xSteps = Math.floor(
                (this.width - this.textOffset) / this.hours.length
            );

            // Schrittweite für Y-Achse berechnen
            this.steps = Math.floor(
                (this.height - this.topPuffer) / this.maxTemp
            );

            this.chart.style.width = this.width - this.textOffset;
            this.chart.style.height = this.height;

            // Erstelle die einzlenen Balken
            this.chart = createBars(
                this.chart,
                this.hours,
                this.steps,
                this.xSteps
            );

            // Erstelle die X-Achsen Beschriftung
            this.xAxis = createHourAxis(
                this.xAxis,
                this.hours,
                this.xSteps,
                this.textOffset
            );

            // Erstelle die Y-Achsen Beschriftung
            this.yAxis = createTempAxis(
                this.yAxis,
                this.maxTemp,
                this.height,
                this.textOffset,
                this.topPuffer
            );

            this.chartContainer.style.width = this.width;
            this.chartContainer.style.height = this.height;

            this.yAxis.style.width = this.textOffset;
            this.yWrap.append(this.yAxis);

            this.xAxis.style.width = this.width - this.textOffset;
            this.xAxis.style.height = this.textOffset;

            this.top.append(this.yWrap);
            this.top.append(this.chart);
            this.chartContainer.append(this.top);
            this.chartContainer.append(this.xAxis);
            this.append(this.chartContainer);
        }
    }

    // Das Custom Element dem Dom bekannt machen
    window.customElements.define('forecast-chart', ForecastChart);

    // ----------------------------------------------------------------------------------
    // createTempAxis erstellt die Y-Achsen Beschriftung für das Diagramm.
    // Es wird abhängig von der Werteanzahl die Schrittweite bestimmt.
    //
    // Dann wird durch die Werte iteriert und mithilfe des Modulo Operators
    // nur die gewollten Werte verwendet.
    // ----------------------------------------------------------------------------------
    const createTempAxis = (yAxis, maxTemp, height, textOffset, topPuffer) => {
        yAxis.style.height = height - topPuffer + 'px';

        // Temperatur zum inkremetieren
        let currentTemp = 0;

        // Schrittweite ist 2, außer es ist über 20 Grad, dann ist sie 3.
        let tempSteps = 2;
        if (maxTemp >= 20) {
            tempSteps = 3;
        }

        // Durch alle Grade bis zur Maxtemperatur durchgehen
        for (let index = 0; index <= maxTemp; index++) {
            // für jede Temperatur eine Div erzeugen
            // -->  Abstände werden mit 'Display: Flex' in Kombination mit
            //      'JustifyContent: Space-Between' perfekt verteilt
            let tag = createDIV(null, 'tempTag');
            tag.style.width = textOffset;

            // Wenn die Stunde in der Schrittweite angezeigt wird,
            // Temperatur einschreiben
            if (index % tempSteps === 0) {
                tag.innerText = currentTemp + '°C';
            }

            // Temperatur inkrementieren
            currentTemp += 1;
            yAxis.prepend(tag);
        }

        return yAxis;
    };

    // ----------------------------------------------------------------------------------
    // createBars nimmt das Stundenarray und erzeugt für jede Stunde
    // einen Balken mit der Höhe der dazugehörigen Temperatur.
    //
    // Die Skalierung erholt über steps, die Y-Schrittweite.
    // ----------------------------------------------------------------------------------
    const createBars = (chart, hours, steps, xSteps) => {
        // durch alle Stunden gehen
        hours.forEach(hour => {
            let bar = createDIV(null, 'bars');

            // Höhe entspricht der Temperatur * der Skalierung
            bar.style.height = Math.abs(hour.temperature * steps);

            // Breite entspricht der Schrittweite der X-Achse
            bar.style.width = xSteps - 10 + 'px';
            chart.append(bar);
        });
        return chart;
    };

    // ----------------------------------------------------------------------------------
    // createHourAxis erzeugt die X-Achse für das Diagramm
    // Sie erstellt für jede Stunde eine Beschriftung.
    // ----------------------------------------------------------------------------------
    const createHourAxis = (xAxis, hours, xSteps, textOffset) => {
        // gehe durch alle Stunden
        hours.forEach(hour => {
            let tag = createDIV(null, 'hourTag');

            // Breite entspricht der X-Achsen-Schrittweite
            tag.style.width = xSteps;
            // Der Text kommt aus der jeweiligen Stunde.
            tag.innerText = hour.time + ' Uhr';
            tag.style.lineHeight = textOffset + 'px';
            xAxis.append(tag);
        });
        return xAxis;
    };

    // -----------------------------------------------------------------------------------------------------------------------------------------------
    //
    // 10. Favoriten
    //
    // Der Favoriten Part erzeugt eine Liste alle Favoriten.
    // Sie geht dazu durch alle Favoriten vom Nutzer und generiert für diese
    // eine grobe Ansicht mit den wesentlichen Informationen.
    //
    // ----------------------------------------------------------------------------------

    async function createListOfFavorites() {
        let storage = JSON.parse(localStorage.storage);
        let currentUser = storage.users.find(
            user => user.name == localStorage.loggedIn
        );

        if (currentUser.favorites.length > 0) {
            let spacer = createDIV('spacer');
            $('contentContainer').prepend(spacer);

            // gehe durch alle Favoriten
            for (let i = 0; i < currentUser.favorites.length; i++) {
                let weatherURL;

                // hol das Wetter für den Favoriten
                weatherURL = await createWeatherCityIdLink(
                    currentUser.favorites[i]
                );

                let weather = await fetch(weatherURL);
                weather = await weather.json();

                let iconName = await weather.weather[0].icon;
                let img = `http://openweathermap.org/img/w/${iconName}.png`;

                let weatherListItem = {
                    city: weather.name,
                    country: weather.sys.country,
                    temperature: getTemperature(weather.main.temp),
                    img: img
                };

                let id = weather.id;

                // erstell Ansicht für den Favoriten mit dem Wetter dazu.
                createListItem(weatherListItem, id);
            }
        }
    }

    // -----------------------------------------------------------------------------------------------------------------------------------------------
    //
    // 11. Suche
    //
    // Der Suchen Part erstellt die Ansicht für die Suche nach Orten.
    // Sie ermöglicht es nach Ortsname, Postleitzahl oder nach Koordinaten zu suchen.
    //
    // ----------------------------------------------------------------------------------

    // ----------------------------------------------------------------------------------
    // createListItem nimmt Wetterdaten und optional eine Stadt ID
    //
    // Die Funktion erstellt eine kleine Ansicht für einen Ort
    // mit dessen Stadtnamen, Land, Temperatur und dessen Wettericon
    //
    // Wenn eine id mitgegeben wird, ist die Kachel für die Favoriten
    // und bekommt noch einen entfernen Button
    // ----------------------------------------------------------------------------------
    function createListItem({ city, country, temperature, img }, id) {
        let container;

        if ($('listContainer') === null) {
            container = createDIV('listContainer');
        }

        let listItem = document.createElement('DIV');

        // fügt dem Favoriten einen Eventlistener hinzu
        // --> Bring einen zur Wetteransicht mit dem angeklicktem Favoriten
        listItem.addEventListener('click', async event => {
            let element = event.target;
            if (
                event.target.id !== 'trashContainer' &&
                event.target.className !== 'fas fa-trash-alt'
            ) {
                // geht hoch bis zur höchsten Ebene vom Favoriten Komponenten
                // --> um Stadtnamen rauszuziehen
                while (element.className !== 'listItem') {
                    element = element.parentNode;
                }

                // Stadtnamen extrahieren
                let text = element.innerText;
                text = text.split(',')[0];

                // Nutzer zur Homepage schicken mit dem ausgewähltem Favoriten
                let cityID = await getCityIDforName(text);
                navLink('home', cityID);
            }
        });

        listItem.className = 'listItem';
        let listLeft = createDIV('listLeft');
        listLeft.className = 'listLeft';
        let listRight = createDIV('listRight');
        listRight.className = 'listRight';

        // Stadtnamen
        let cityName = document.createElement('DIV');
        cityName.className = 'cityName';
        cityName.innerText = checkMutatedVowels(city) + ', ';

        // Länderkürzel
        let countryName = createDIV('countryName');
        countryName.innerText = country;

        listLeft.append(cityName);
        listLeft.append(countryName);

        // Temperatur
        let temperatureContainer = createDIV('temperatureContainer');
        temperatureContainer.innerText = temperature;

        // Img Icon
        let imgDiv = createDIV('imgDiv');
        let imgContainer = document.createElement('img');
        imgContainer.src = img;
        imgDiv.append(imgContainer);

        // Löschen Button für Favoritenansicht
        let trashContainer;
        if (id) {
            trashContainer = createDIV('trashContainer');
            trashContainer.addEventListener('click', () => {
                removeFavorite(id);
                navLink('favorites');
            });
            let trashIcon = document.createElement('I');
            trashIcon.className = 'fas fa-trash-alt';
            trashContainer.append(trashIcon);
        }

        listRight.append(temperatureContainer);
        listRight.append(imgDiv);
        if (id) {
            listRight.append(trashContainer);
        }

        listItem.append(listLeft);
        listItem.append(listRight);

        if ($('listContainer') === null) {
            container.prepend(listItem);
            $('contentContainer').append(container);
        } else {
            $('listContainer').prepend(listItem);
        }
    }

    // ----------------------------------------------------------------------------------
    // createSearchToggleButton ist der Button über den man auswählt,
    // ob man per Stadtname, Postleitzahl, oder per Koordinaten suchen möchte.
    //
    // Je nach Button werden die entsprechenden Inputs geladen.
    // ----------------------------------------------------------------------------------
    function createSearchToggleButton() {
        let toggleButton = createDIV('searchToggleButton');

        // Button für Ortsname
        let toggleButtonLeft = document.createElement('BUTTON');
        toggleButtonLeft.id = 'searchToggleButtonLeft';
        toggleButtonLeft.className = 'searchToggleActive';
        toggleButtonLeft.innerText = 'Ort';
        toggleButtonLeft.addEventListener('click', () => {
            createSearchInput('name');
        });

        // Button für Postleitzahl
        let toggleButtonMiddle = document.createElement('BUTTON');
        toggleButtonMiddle.id = 'searchToggleButtonMiddle';
        toggleButtonMiddle.className = 'searchToggleNotActive';
        toggleButtonMiddle.innerText = 'Postleitzahl';
        toggleButtonMiddle.addEventListener('click', () => {
            createSearchInput('postalCode');
        });

        // Button für Koordinaten
        let toggleButtonRight = document.createElement('BUTTON');
        toggleButtonRight.id = 'searchToggleButtonRight';
        toggleButtonRight.className = 'searchToggleNotActive';
        toggleButtonRight.innerText = 'Koordinaten';
        toggleButtonRight.addEventListener('click', () => {
            createSearchInput('coordinates');
        });

        toggleButton.append(toggleButtonLeft);
        toggleButton.append(toggleButtonMiddle);
        toggleButton.append(toggleButtonRight);
        $('contentContainer').append(toggleButton);

        createSearchInput('name');
    }

    // ----------------------------------------------------------------------------------
    // createSearchInput wird von dem toggleButton gerufen und
    // erzeugt je nach Parameternamen die entsprechenden Inputs
    // ----------------------------------------------------------------------------------
    function createSearchInput(type) {
        if ($('contentContainer') && $('inputContainer') === null) {
            let inputContainer = createDIV('inputContainer');
            $('contentContainer').append(inputContainer);
        }

        // inputContainer einmal leeren vor der Erstellung von Inputs
        clearInputContainer();

        // Stellt den Button auf Name ein
        if (type === 'name') {
            $('searchToggleButtonLeft').className = 'searchToggleActive';
            $('searchToggleButtonMiddle').className = 'searchToggleNotActive';
            $('searchToggleButtonRight').className = 'searchToggleNotActive';

            // erstellt den Input und den Button für die Suche nach einem Ortsnamen
            createSearchByPlaceInput();
            createSearchSubmitButton(type);

            // Stellt den Button auf Postleitzahl ein
        } else if (type === 'postalCode') {
            $('searchToggleButtonLeft').className = 'searchToggleNotActive';
            $('searchToggleButtonMiddle').className = 'searchToggleActive';
            $('searchToggleButtonRight').className = 'searchToggleNotActive';

            // Erstellt den Input für Suche nach Ortsnamen
            createSearchByPlaceInput();

            // Erstellt ein Input für das Länderkürzel
            let countryCodeInput = document.createElement('INPUT');
            countryCodeInput.addEventListener('keyup', event => {
                if (event.keyCode === 13) {
                    event.preventDefault();
                    $('placeSubmitButton').click();
                }
            });

            countryCodeInput.id = 'countryCodeInput';
            countryCodeInput.placeholder = 'Länderkürzel';
            $('inputContainer').append(countryCodeInput);
            $('placeInput').placeholder = 'Postleitzahl';

            // Erstellt den Submit Button für die Suche nach der Postleitzahl
            createSearchSubmitButton(type);

            // Stellt den Button auf Koordinaten ein
        } else if (type === 'coordinates') {
            $('searchToggleButtonLeft').className = 'searchToggleNotActive';
            $('searchToggleButtonMiddle').className = 'searchToggleNotActive';
            $('searchToggleButtonRight').className = 'searchToggleActive';

            // Erstellt einen Input für den Längengrad
            createSearchByPlaceInput();

            // Erstellt einen Input für den Breitengrad
            let latitudeInput = document.createElement('INPUT');
            latitudeInput.addEventListener('keyup', event => {
                if (event.keyCode === 13) {
                    event.preventDefault();
                    $('placeSubmitButton').click();
                }
            });

            latitudeInput.id = 'latitudeInput';
            latitudeInput.placeholder = 'Breitengrad';

            $('inputContainer').append(latitudeInput);

            $('placeInput').placeholder = 'Längengrad';
            $('placeInput').style.width = '200px';

            // Erstellt einen Submit Button für die Suche nach Koordinaten
            createSearchSubmitButton(type);
        }
    }

    // ----------------------------------------------------------------------------------
    // createSearchByPlaceInput erstellt die Inputs um nach einem Ort durch dessen
    // Namen zu suchen.
    // ----------------------------------------------------------------------------------
    const createSearchByPlaceInput = () => {
        // erstellt Input für den Ortsnamen
        let input = document.createElement('input');
        input.addEventListener('keyup', event => {
            if (event.keyCode === 13) {
                event.preventDefault();
                $('placeSubmitButton').click();
            }
        });

        input.id = 'placeInput';
        input.placeholder = 'Ort';
        $('inputContainer').append(input);
    };

    // ----------------------------------------------------------------------------------
    // createSearchSubmitButton erstellt einen Submit Button
    // für die Suche.
    //
    // Die Funktion nimmt einen typen und reagiert entsprechend.
    // ----------------------------------------------------------------------------------
    const createSearchSubmitButton = async type => {
        let button = createSubmitButton('placeSubmitButton', 'Suche');
        button.addEventListener('click', async () => {
            let result;

            // Es handelt sich um eine Suche nach Namen
            if (type === 'name') {
                // Wetter für Ortsnamen holen
                result = await fetchWeather(
                    await createWeatherCityNameLink($('placeInput').value)
                );

                // Suche nach Postleitzahl
            } else if (type === 'postalCode') {
                // Daten auslesen
                let country;
                console.log($('countryCodeInput').value);

                if ($('countryCodeInput').value === '') {
                    country = 'DE';
                } else {
                    country = $('countryCodeInput').value;
                }
                let city = $('placeInput').value;

                // Wetter für Postleitzahl holen
                result = await fetchWeather(
                    await createWeatherCityPostalCodeLink(city, country)
                );

                // Suche nach Koordinaten
            } else if (type === 'coordinates') {
                // Daten auslesen
                let long = $('placeInput').value;
                let lat = $('latitudeInput').value;

                // Wetter für Koordinaten holen
                result = await fetchWeather(
                    await createWeatherCoordinateLink(long, lat)
                );
            }

            // Letzte bestehende Suchelement löschen falls bereits 5 existieren
            document.getElementsByClassName('listItem').length === 5
                ? $('listContainer').lastChild.remove()
                : null;

            // Prüft ob das anzuzeigende Element bereits angezeigt wird
            let create = true;
            if (result) {
                let items = document.getElementsByClassName('cityName');
                if (items.length > 0) {
                    for (let item of items) {
                        let text = item.innerText;
                        text = text.split(',')[0];
                        if (text === result.city) {
                            create = false;
                        }
                    }
                }
            } else {
                create = false;
            }
            // Erstellt eine Anzeige für das Element
            create ? createListItem(result) : null;
        });

        $('inputContainer').append(button);
    };

    // ----------------------------------------------------------------------------------
    // fetchWeather nimmt eine URL und fragt damit das Wetter an
    // ----------------------------------------------------------------------------------
    const fetchWeather = async weatherURL => {
        try {
            // Macht eine Anfrage an die Api
            let weather = await fetch(weatherURL);
            weather = await weather.json();

            // Extrahiert das Icon
            let iconName = await weather.weather[0].icon;
            let img = `http://openweathermap.org/img/w/${iconName}.png`;

            // Erzeugt ein Objekt mit den wesentlichen Daten
            let weatherListItem = {
                city: weather.name,
                country: weather.sys.country,
                temperature: getTemperature(weather.main.temp),
                img: img
            };

            // Gibt die Daten zurück
            return weatherListItem;
        } catch {
            // Gibt Fehlermeldung aus falls der angegebene Ort nicht existiert
            alert('Den eingegebenen Ort gibt es nicht!');
            return null;
        }
    };

    // ----------------------------------------------------------------------------------
    // createSubmitButton bekommt eine id und ein label und erzeugt
    // daraus einen button
    // ----------------------------------------------------------------------------------
    function createSubmitButton(id, label) {
        let button = document.createElement('BUTTON');
        button.id = id;
        button.innerText = label;
        return button;
    }

    // ----------------------------------------------------------------------------------
    // clearInputContainer löscht alles aus dem InputContainer
    // ----------------------------------------------------------------------------------
    const clearInputContainer = () => {
        let container = $('inputContainer');

        while (container.hasChildNodes())
            container.removeChild(container.firstChild);
    };

    // -----------------------------------------------------------------------------------------------------------------------------------------------
    //
    // 12. NavLink
    //
    // navLink wird gerufen um die Ansicht zu wechseln.
    // Die Funktion nimmt einen Ort und ruft die entsprechenden Funktionen
    // um die Ansicht zu erstellen
    // Hier wird außerdem geprüft ob der Nutzer angemeldet ist,
    // um ihn ggf. zur Anmeldeseite zu bringen.
    // ----------------------------------------------------------------------------------
    const navLink = (placeToGo, cityID) => {
        clearContent();
        if (loggedIn()) {
            createHeaderNavigationIcons();
            createUserField();
            switch (placeToGo) {
                case 'home':
                    createToggleButton();
                    createCurrentWeatherCard(cityID);
                    break;
                case 'favorites':
                    createListOfFavorites();
                    break;
                case 'search':
                    createSearchToggleButton();
                    break;
                case 'userSettings':
                    new Settings();
                    break;
                default:
                    home();
                    break;
            }
        } else {
            clearHeaderNavigationIcons();
            clearUser();
            $('contentContainer').append(new LoginCard());
        }
    };

    navLink('home');

    // -----------------------------------------------------------------------------------------------------------------------------------------------
    //
    // 13. Shortcuts
    //
    // Erstellt shortcuts um mit strg-1 bis strg-3 zur Homepage, zu den Favoriten,
    // und zur Suche zu kommen
    // ----------------------------------------------------------------------------------
    const createShortcuts = (() => {
        document.onkeydown = event => {
            if (event.ctrlKey && event.which == 49) {
                event.preventDefault();
                navLink('home');
            } else if (event.ctrlKey && event.which == 50) {
                event.preventDefault();
                navLink('favorites');
            } else if (event.ctrlKey && event.which == 51) {
                event.preventDefault();
                navLink('search');
            }
        };
    })();
});
