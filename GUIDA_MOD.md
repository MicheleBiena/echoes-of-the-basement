# Echoes of the Basement - Guida Beta

Questa guida serve a dare ai beta tester e ai content creator un'idea chiara di cosa aspettarsi dalla mod, senza trasformarla in una wiki completa. Alcuni numeri sono ancora da bilanciare e diverse grafiche/audio sono placeholder o in lavorazione.

## Stato Attuale

Oggetti implementati: 15 su 18.

Passivi e familiari giocabili:

| Oggetto | Quality | Stato |
|---|---:|---|
| Timber Hearth | 3 | Implementato |
| The Attlerock | 2 | Implementato |
| Ash Twin | 2 | Implementato |
| Ember Twin | 2 | Implementato |
| Brittle Hollow | 3 | Implementato |
| Giant's Deep | 3 | Implementato |
| Dark Bramble | 3 | Implementato |
| Interloper | 3 | Implementato |
| Quantum Moon | 4 | Implementato |
| Hearthian Spacesuit | 3 | Implementato |

Attivi giocabili:

| Oggetto | Quality | Stato |
|---|---:|---|
| Riebeck's Banjo | 2 | Implementato |
| Esker's Whistle | 2 | Implementato |
| Gabbro's Flute | 2 | Implementato |
| Chert's Drums | 2 | Implementato |
| Solanum's Keyboard | 3 | Implementato |

Ancora in sviluppo: The Stranger, Feldspar's Harmonica, The Prisoner's Theremin.

## Come Testare

La build attuale punta molto sui Planetari. Hearthian Spacesuit e' pensato anche come oggetto da test: nella build corrente forza la comparsa dei Planetari quando possibile e fa trovare oggetti Echoes disponibili nei Planetari.

Gli oggetti non ancora implementati sono volutamente fuori dalle pool principali o hanno placeholder. Se compaiono via console, possono non avere effetto.

Quando testate, guardate soprattutto:

- se gli effetti sono comprensibili senza leggere EID;
- se gli oggetti cambiano davvero il modo di giocare la stanza;
- se ci sono cali di performance con molte entita' o molti proiettili;
- se le sinergie sono evidenti ma non automatiche al punto da diventare noiose;
- se un effetto sembra bello da vedere anche in una registrazione o clip.

## Oggetti Giocabili

### Hearthian Spacesuit

Oggetto di accesso al tema Planetario della mod. Aumenta drasticamente la presenza degli oggetti Echoes nei Planetari e aggiunge il costume della tuta spaziale a Isaac.

Da osservare: il costume deve essere leggibile su personaggi diversi e non deve coprire troppo la silhouette. Il comportamento dei Planetari e' volutamente generoso in fase di test.

### Timber Hearth

Crea un falo nella starting room dei piani successivi al primo. Avvicinarsi al fuoco permette di riposare una volta per piano: cura, ricarica l'attivo e gestisce ricompense alternative per personaggi speciali.

Da osservare: il falo deve sembrare un punto sicuro e desiderabile, non un pickup confuso. Il raggio di interazione deve sentirsi naturale.

### The Attlerock

Familiar orbitale difensivo/offensivo. Assorbe colpi nemici vicini e, dopo averne accumulati abbastanza, li restituisce come lacrime di roccia.

Da osservare: deve aiutare senza giocare la stanza al posto del player. La sinergia con Esker's Whistle deve essere visibile e soddisfacente.

### Ash Twin

Oggetto a progressione di piano. Entrando in nuove stanze, la sabbia "si svuota" e Isaac diventa piu' agile e rapido nel fuoco. L'ultimo tier lascia una crescita permanente alla run.

Da osservare: deve dare l'idea di migliorare man mano che esplori, senza obbligare a pulire ogni singola stanza.

### Ember Twin

Gemello speculare di Ash Twin. Entrando in nuove stanze, la sabbia "sale": Isaac diventa piu' pesante e lento, ma guadagna danno e infine una ricompensa di vita o equivalente.

Da osservare: il compromesso danno/velocita' deve essere percepibile ma non punitivo oltre il divertimento.

### Brittle Hollow

Apre piccoli rift sotto i nemici colpiti. I rift attirano, danneggiano nel tempo e creano un effetto scenografico di frammenti che collassano verso il centro.

Da osservare: i rift devono essere leggibili e potenti contro gruppi di nemici, ma senza saturare lo schermo. La sinergia con Riebeck's Banjo e' intenzionalmente molto evidente.

### Giant's Deep

Trasforma le lacrime in cicloni lenti e rimbalzanti. Alcuni cicloni attirano, altri infliggono danno al contatto, lanciano i nemici e possono farli schiantare per danni extra. Raramente puo' partire un tifone enorme.

Da osservare: e' un oggetto che cambia molto il ritmo del combattimento. La lentezza delle lacrime deve sembrare un costo interessante, non un difetto tecnico. Attenzione particolare a performance e leggibilita' con Soy Milk o molti proiettili.

### Dark Bramble

Dopo 45 secondi nel piano, una rana pescatrice inarrestabile inizia a inseguire Isaac tra le stanze. Se tocca Isaac, lo uccide. Se il player sopravvive fino alla Boss Room e batte il boss mentre la caccia e' attiva, compare un oggetto quality 3 o superiore da una pool principale.

Da osservare: deve trasmettere pressione e paura senza sembrare un nemico normale. Il premio deve sembrare meritato, ma la minaccia non deve rendere ogni piano ingestibile.

### Interloper

Oggetto passivo da controllo e danno periodico. In combattimento genera una raffica di ghost matter ghiacciata attorno a Isaac, con effetti di veleno, rallentamento e possibile congelamento.

Da osservare: il burst deve sentirsi come un evento chiaro, non come danno invisibile. Controllare che non sprechi cooldown nelle stanze vuote.

### Quantum Moon

Oggetto Q4 pensato per rendere le Treasure Room rischiose e memorabili. Il pedestal puo' cambiare quando lo osservi di nuovo: puoi cercare qualcosa di meglio, ma ogni osservazione aumenta il rischio di perdere tutto. Gli oggetti saltati diventano wisps quando scegli.

Da osservare: il rischio deve essere chiaro. Il giocatore deve capire che sta scegliendo fra "prendo ora" e "rischio un'altra osservazione".

### Riebeck's Banjo

Attivo a 3 cariche. Piazza un piccolo accampamento stabile nel punto in cui viene usato: il campo annulla i proiettili nemici che entrano nell'area, ma Isaac e' protetto solo se resta dentro. Con Brittle Hollow, restare nel campo potenzia i colpi in modo molto marcato. All'utilizzo suona una delle tre varianti audio del banjo.

Da osservare: il campo deve essere leggibile come area fissa. Il cristallo centrale deve sembrare il punto di ancoraggio, mentre l'anello indica l'area sicura.

### Esker's Whistle

Attivo a 1 carica. Evoca supporto temporaneo dalla base: aggiunge un Attlerock orbitale per la stanza. Se il player ha gia' The Attlerock, il supporto viene amplificato.

Da osservare: deve sembrare un pulsante utile anche senza sinergia, ma chiaramente piu' interessante con The Attlerock.

### Gabbro's Flute

Attivo a 3 cariche. Trasforma brevemente la stanza in una situazione molto poco lucida: lo schermo diventa ondulato stile Wavy Cap, mentre i nemici restano confusi piu' a lungo. Con Giant's Deep, i cicloni entrano nel caos e iniziano a spostarsi imprevedibilmente nella stanza.

Da osservare: l'effetto deve essere funny e riconoscibile, ma non deve diventare fastidioso da guardare per troppo tempo. Con Giant's Deep deve creare clip assurde senza far crollare la leggibilita' della stanza.

### Chert's Drums

Attivo a 3 cariche. Analizza la stanza per pochi secondi: i nemici attivi vengono marchiati e subiscono piu' danni. Con Ash Twin, l'analisi rende Isaac piu' agile e rapido. Con Ember Twin, l'analisi diventa piu' pesante: piu' danno, meno velocita' e piccoli tick di erosione sui nemici marchiati.

Da osservare: deve sembrare uno strumento tattico e leggibile, non un'esplosione invisibile di danno. Il marchio sui nemici deve far capire che Chert ha "letto" la stanza.

### Solanum's Keyboard

Attivo a 4 cariche. Suona una memoria casuale di uno dei pianeti principali: puo' curare, dare boost temporanei, aprire rift, sparare cicloni, spaventare nemici, creare un wisp da un oggetto posseduto o generare ghost matter ghiacciata. A ogni uso parte un overlay full screen stile giantbook con il pianeta scelto.

Da osservare: deve sembrare un riassunto imprevedibile del sistema, non un D100 generico. L'effetto casuale deve restare comprensibile anche quando il player non conosce Outer Wilds.

## Oggetti In Sviluppo

Questi oggetti non sono ancora pronti per giudizi di bilanciamento.

- Feldspar's Harmonica: dash spericolato, rottura di muri e apertura di passaggi.
- The Prisoner's Theremin e The Stranger: da progettare piu' avanti, con tema DLC separato.

## Nota Per Content Creator

La mod e' pensata per produrre momenti riconoscibili: oggetti che cambiano il modo in cui si muove una stanza, effetti visuali leggibili e sinergie che si capiscono anche guardando una clip.

Non tutto quello che sembra "segreto" va spiegato subito. Gli strumenti dei viaggiatori avranno un ruolo piu' grande nella run completa, ma per ora conviene presentarli come attivi tematici con sinergie forti.

## Segreti

Esiste una direzione segreta legata agli strumenti dei viaggiatori. Non e' necessario spiegarla nella guida pubblica: basta sapere che, a mod completa, usare gli strumenti durante una run avra' un significato speciale.
