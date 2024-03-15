// Set button listeners
document.getElementById("play").addEventListener("click", setSignals);
document.getElementById("stop").addEventListener("click", reset);

// Flag to stop loop on clicking "stop" button
let stopLoop = false;

// Functions to add/remove "lit" class elements
const removeLit = (elements) => {
    for (let el of elements) {
        el.classList.remove("lit");
    }
}
const addLit = (elements) => {
    for (let el of elements) {
        el.classList.add("lit");
    }
}

// Timer function using promises to account for asynchronous app behaviour
const timer = (seconds) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve('resolved');
        }, (1000 * seconds)); 
    });
}

// Define traffic signals. The 4 are divided into 2 by their axis as they mirror each other's behaviour
function Signal(axis) {
    this.loopCount = 0; // Escape flag to prevent max stack given looping behaviour
    this.state = ""; // Light state set to empty string to prevent loop initiation on load

    // Create array-like object of each signal light for both signals on an axis
    this.red = document.querySelectorAll(`.${axis}.red`);
    this.amber = document.querySelectorAll(`.${axis}.amber`);
    this.left = document.querySelectorAll(`.${axis}.left`);
    this.straight = document.querySelectorAll(`.${axis}.straight`);
    this.right = document.querySelectorAll(`.${axis}.right`);

    // Methods to control different signal states, spread syntax used to expand the array-like objects
    // Note: Repeated spread syntax & flag checks work well but read poorly. This needs to be remodelled
    this.goLights = () => { if (!stopLoop) { 
        removeLit([...this.red , ...this.amber]);
        addLit([...this.straight]);
    }}
    this.slowLights = () => { if (!stopLoop) {
        removeLit([...this.straight , ...this.left]);
        addLit([...this.amber]);
    }}
    this.rightOnlyLights = () => { if (!stopLoop) {
        removeLit([...this.amber]);
        addLit([...this.red , ...this.right]);
    }}
    this.stoppedLights = () => { if (!stopLoop) {
        removeLit([...this.right]);
        addLit([...this.red]);
    }}
    this.leftOnlyLights = () => { if (!stopLoop) {
        addLit([...this.left]);
    }}
    this.readyLights = () => { if (!stopLoop) {
        addLit([...this.amber, ...this.red]);
    }}

    // Object defining state transitions and actions
    this.transitions = {
        go: {
            toGo: async () => { if (this.loopCount<10 && !stopLoop) {
                this.loopCount++;
                this.goLights();
                await timer(8).then(() => {
                    this.state = "slow";
                    this.dispatch("toSlow");
                });
            }}
        },
        slow: {
            toSlow: async () => { if (!stopLoop) {
                this.slowLights();
                await timer(3).then(() => {
                    this.state = "rightOnly",
                    this.dispatch("toRightOnly");
                })
            }}
        },
        rightOnly: {
            toRightOnly: async () => { if (this.loopCount<10 && !stopLoop) {
                this.rightOnlyLights();
                    await timer(5).then(() => {
                        this.state = "stopped",
                        this.dispatch("toStopped")
                })
            }}
        },
        stopped: {
            toStopped: async () => { if (this.loopCount<10 && !stopLoop) {
                this.stoppedLights();
                await timer(13).then(() => {
                    this.state = "leftOnly",
                    this.dispatch("toLeftOnly")
                });
            }}
        },
        leftOnly: {
            toLeftOnly: async () => { if (this.loopCount<10 && !stopLoop) {
                this.leftOnlyLights();
                await timer(5).then(() => {
                    this.state = "ready",
                    this.dispatch("toReady")
                });
            }}
        },
        ready: {
            toReady: async () => { if (this.loopCount<10 && !stopLoop) {
                this.readyLights();
                await timer(2).then(() => {
                    this.state = "go",
                    this.dispatch("toGo")
                });
            }}
        },
    };

    // Method to dispatch state - prevents inappropriate action calls and ensure predictable behaviour - a cardinal feature of deterministic FSMs
    this.dispatch = (actionName) => { if(!stopLoop){
        const action = this.transitions[this.state][actionName];
        if (action) {
            action();
        } else {
            console.error(`Invalid action, cannot call ${actionName} from ${this.state}`);
        }
    }}
}

// Instantiate signal axes
const verticals = new Signal(`vertical`);
const horizontals = new Signal(`horizontal`);

// Function start loop & set initial signal states
const setSignals = () => { 
    stopLoop=false;
    verticals.loopCount = 0;
    horizontals.loopCount = 0;
    verticals.state = "ready";
    horizontals.state = "stopped";
    verticals.dispatch("toReady");
    horizontals.dispatch("toStopped")
}

// Function to reset lights
async function reset() { 
    stopLoop = true;
    await timer(13).then(() => {
        removeLit([...verticals.left, ...verticals.right, ...verticals.straight, ...verticals.amber, ...horizontals.left, ...horizontals.right, ...horizontals.straight, ...horizontals.amber]);
        addLit([...verticals.red, ...horizontals.red]);
    });
}

