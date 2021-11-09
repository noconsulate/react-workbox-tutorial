# React PWA with Workbox
#### Making a Progressive Web App using React is easy!*
\*unless you actually want it to do anything.

### Introduction

My goal with this article is to get you going making a PWA with React and Workbox that has all the features of a real progressive web app including installability, prechaching, background-sync, and push notifications. I won't always go into all the details but I will present the resources I've put together and after this you will be able to make a real PWA. Although this tutorial is written for React the techniques described should work with any framework.

The backbone of a PWA is the [service worker](https://developers.google.com/web/ilt/pwa/introduction-to-service-worker). A servcie worker is a JavaScript file that runs in the browser but on its own thread. If a user has multiple tabs open on the same site with a service worker, one instance of the server worker handles each tab. Every request for the site goes through the service worker and it can then respond with a cache or put the request through the the network.

There are many approaches to handling requests with a service worker but the easiest way is Google's [Workbox](https://developers.google.com/web/tools/workbox) and the easiest way to get Workbox into a React app is to just use the PWA template that create-react-app provides. I was able to make an existing React app into a PWA simply by copying /src into a freshly spun CRA PWA-template but you can also get your bundle into Workbox other ways. It's just trickier.

### create-react-app boilerplate

So you've been sold on the concept of doing a PWA and you want to make it happen. You search *react PWA* and you find [create-react-app PWA.](https://create-react-app.dev/docs/making-a-progressive-web-app/) It's easy! Simply spin up a create-react-app with the PWA template:

`npx create-react-app randos --template cra-template-pwa`

*You can start following along now, or you can clone the repo later. It might be a good idea to use the repo in case your version of create-react-app is different and you end up with different boilerplate*

There's one line we'll need to change in *src/index.js* to register our service worker. Change line 18 to:

**src/index.js**
```
serviceWorkerRegistration.register();
```

Now you'll need to build and run a server because a PWA isn't really meant to run on a development server. If you investigate `register()` in *serviceWorkerRegistration.js* you will notice that the service worker isn't registered unless we're in production. This means we'll be losing out on hot-reloading so let's make our lives slightly easier by adding a simple script to our scripts object in *package.json:*

**package.json**
```
 "scripts": {
   "start": "react-scripts start",
   "build": "react-scripts build",
   "buildnserve": "react-scripts build && serve -s build",
   "test": "react-scripts test",
   "eject": "react-scripts eject"
 },
```
 Now we can run our app!

`cd pwa-set`

`npm run buildnserve`

Chrome has a handy tool called [Lighthouse](https://developers.google.com/web/tools/lighthouse/) baked right into DevTools. So navigate to *http://localhost:5000* in Chrome using an incognito tab, open up DevTools, and find the Lighthouse tab. Click on 'Generate report', wait several seconds, and *voila!* 

![freshly spun up CRA PWA template passes lighthouse](/home/janssen/Documents/Tutorial/Images/lighthouse-passed-fresh-teamplate.png  "Wow! Almost effortless!")

It passes! A fully (mostly fully) certified PWA. passed by the Master himself. It's even installable! Go ahead and click on little download icon in the address bar and try it out. It depends on your system but when I do it on my Linux system it gives me a shortcut on my desktop and the app pops up in a new window without all the buttons and menus of the browser. 

The CRA boilerplate with its rotating atom logo now lives locally on your computer and you can open it up and view it offline. But that's all it does. It's basically just a static site saved to your computer. If your app fetches any data it won't be saved offline and it certainly won't cache any **post** or **patch** requests you might want to have synced when the app goes back online. What's worse is that if you update the contents of the site on the server the browser/browser wrapper will keep showing the user the offline site it already has and won't update without a hard refresh.

### Supabase for data

We're making simple app that lets you add numbers to an array. Since we're going to cache and sync database calls we'll need a database. I've chosen [Supabase](https://supabase.io/) because it's free and easy and a good alternative to Firebase. 

Go to Supabase and start a new project. After the project has initialized click on the *settings* gear icon on the left and then open the *API* tab. You are looking for your project API key and your URL. Create *.env* in your project's root folder and add the following:

**.env**
```
REACT_APP_SUPABASE_URL=your-project-url
REACT_APP_SUPABASE_ANON_KEY=your-project-api-key
```
*please note this is totally insecure, but since this isn't a Supabase tutorial we'll leave it as it is.*

Find the SQL Editor in the Supabase menu, click on *New Query*, and paste this in:
```
CREATE TABLE my_set(
  id serial PRIMARY KEY,
  numbers int[]
);

INSERT INTO my_set(numbers)
VALUES(ARRAY [3, 7, 18, 23, 33, 42, 118, 227])
```
Now hit ctrl + enter or click the 'run' button. This will create a table called **my_set** with two columns, an **id** and an array of 4-bit integers called **numbers**. We've inserted a column with a short array  assigned to **numbers** to get us started and it's assigned an **id** of "1". In this tutorial we're only going to be dealing with this single row. As long as you've configured *.env* correctly we shouldn't have to deal with the Supabase site anymore. 

### Build the app
Now we're going to make the React app. It's just going to be list of the **numbers** in our database and an input field to update new numbers into the database. Here, why don't you just go ahead and copy and paste mine:

**src/App.js**
```
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js'

import './App.css';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

const supabaseFetch = async () => {
  const { data, error } = await supabase
    .from('my_set')
    .select('numbers')
    .match({ id: 1 })
  
  console.log(data, error)
  if (data) return data[0].numbers
}

const supabaseUpdate = async (value) => {
  console.log(value)
  const { data, error } = await supabase
    .from('my_set')
    .update({numbers: value})
    .match({ id: 1 })
  
  console.log(data, error)
}

function App() {
  const [numbers, setNumbers] = useState([])
  const [input, setInput] = useState('')

  useEffect(async () => {
    const data = await supabaseFetch()
    if (data) setNumbers(data)
  }, [])

  const handleInput = (e) => {
    setInput(e.target.value)
  }
  const handleSubmit = () => {
    const newArray = numbers
    newArray.push(input)
    setNumbers(newArray)
    setInput('')
    supabaseUpdate(newArray)
  }

  return (
    <div className="App">
      <div>
        numbers: {numbers.length > 0 && numbers.map((number, index) => {
            if (index < numbers.length - 1) {
              return <React.Fragment key={index}>{number}, </React.Fragment>;
            } else {
              return <React.Fragment key={index}>{number}</React.Fragment>;
            }
          })}
      </div>
      <br />
      <div>
        <label for="insert">Insert: </label>
        <input id="insert" type='number' value={input} onChange={handleInput} />
        <button onClick={handleSubmit}>Submit</button>
      </div>
    </div>
  );
}

export default App;
```

Also you need to install a package:

`npm install @supabase/supabase-js`

If you want you can clone the repo for this tutorial. You can start at this point as long as you set up Supabase and configure *.env* as shown above.

`git clone https://github.com/noconsulate/react-workbox-tutorial.git
`

`cd randos`

`git checkout 1-app-ready`

Before we do anything else let's just review the logic of our app real quick. We simply `select` the array **numbers** from **my_set** in Supabase and display them. We have a number input and when submit is clicked we push the value to our existing numbers array, update our local state, and `update` the **numbers** array in **my_set**. So we have a very basic  CRUD app except you can't delete anything so actually it's CRU. 

Remember we're not running a development server and there's no hot reload, so we'll have to manually rebuild and serve. Shut down your server in the console (Ctrl + C) and run `npm run buildnserve` to build and launch the server. Now refresh the browser and you'll see - what the?!!! We just rewrote *app.js* but we're still seeing that stupid rotating atom! Notice these two lines written to the console:
>This web app is being served cache-first by a service worker. To learn more, visit https://cra.link/PWA
New content is available and will be used when all tabs for this page are closed. See https://cra.link/PWA.

### Service worker basics and Workbox

What's happening here is that the service worker has hijacked the client and intercepting all requests to the assets bundled by Webpack. This is handled by a single line in our service worker, thanks to Workbox:
**service-worker.js** *line 22*

```
precacheAndRoute(self.__WB_MANIFEST);
```

`__wB_MANIFEST` refers to the totality of the build provided by Webpack. The method `precacheAndRoute` provided by Workbox takes these assets and [precache](https://developers.google.com/web/tools/workbox/modules/workbox-precaching) them. All requests for these assets will be served *cache-first*, which means that if there is a cache the service worker will serve it regardless of there being a network connection.

What I'm describing is the *lifecycle* of the cache and the assets it handles. Workbox offers standard *strategies* for dealing with caches and it's appropriate to use different strategies for different data. Precaching is a perfectly good strategy for the Webpack build, we just need a way for the client to update when there are newer available.  

(Open up the Application tab in DevTools, select *Service Workers* from the menu, and check the 'Update on reload' option. Now reload the tab and finally that spinning atom is replaced by our app. We can accomplish the same thing by closing all tabs that are visiting our app's URL or doing a hard-refresh using Ctrl + F5. Make sure to uncheck 'Update on reload'.

Let's put a new version of our Webpack build on the server. Make a trivial change in the return statement of *App.js* such as a whitespace (i.e. `num  bers: {" "}`) and rebuild and serve. This puts a new version of the Webpack build in the *build* directory. Making sure 'Update on reload' isn't checked just do a normal refresh.

![a new build is waiting to activate](/home/janssen/Documents/Tutorial/Images/waiting-to-activate-circled.png  "waiting to activate")

You can see #3 is 'activated and running' and #4 is 'waiting to activate'. These are versions of the service worker. When the app is loaded the existing service worker takes control and handles all the requests, either serving caches or patching requests through to the network according to how it's programmed. The behavior of Workbox's *precacheAndRoute* is to serve the existing cached assets, in our case the Webpack build, and then if there are updates to those same assets on the server to download those updated assets as a new cache and insantiate a *new* service worker. This new service worker that contains the new assets in its precache is 'installed' and is 'waiting to activate.' That 'skipWaiting' button does exactly that. In the meantime the old service worker is *active* and is serving the old cache.

Before you try 'skipWaiting' make another change to *App.js*, then buildnserve, and refresh the tab. You should now notice that the "waiting to activate" service worker is at least two versions ahead of the activated one. The service worker has *installed* the newest of itself but the original one is still *active*. Now go ahead and click 'skipWaiting'. Tada! The window is now displaying the newest version.

Much of this logic is actually happening in *serviceWorkerRegistration.js*.  I encourage you to take time now to study that file and discover what's happening. It may seem a bit complex but it's straight-foward and you'll gain a good understanding of how the client (i.e. your browser tab) and service worker work together.

What's essential to understand is that there are at times two (or even three) service workers in play. Put this in your browser console and run it:
```
let registration
navigator.serviceWorker.getRegistration().then(reg => registration = reg)
```

Now explore the registration object in the console. You should see the properties *installing*, *waiting*, and *active*. *Active* will contain a *ServiceWorker* object and if you have a 'waiting to activate' service worker you'll have a *waiting* *ServiceWorker* object as well. As for *installing* , a *ServiceWorker* will move from *installing* to *waiting* pretty quickly so that property will usually be null. These are the three service workers mentioned above.

Check out line 66 in *service-worker.js*:

**service-worker.js** *line 66*
```
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
```

The service worker is listening for a 'message' event and when it hears 'SKIP_WAITING' it calls its own `skipWaiting()` method. When a *waiting* service worker calls its own`skipWaiting()` that service worker becomes the *ative* one. Take notice that the *waiting* service worker must call `skipWaiting()`. If the *active* one calls it nothing will happen because it's not waiting because it's already active. This should underline the concept that the *active* and *waiting* service workers are distinct entities. 

What we want to do is give the user a way to display the new precache, i.e. call `skipWaiting()` on the *waiting* service worker. So we have to communicate from the client to the *waiting* service worker. We also need to let the user know when there is an update waiting so we need to keep track of the status of the registered service workers. None of this is straight-forward but fortunately there  are some tools to make it easy.

### Update-waiting and refresh
To facilliate communication between the client and service worker and track events in the service worker, Workbox offers the module [workbox-window](https://developers.google.com/web/tools/workbox/modules/workbox-window). This is probably the best way to go however to make use of it one must register the service worker with workbox-window itself. Recall your study of serverWorkerRegistration.js - to register the service worker it's not so simple as calling `register('/service-worker.js')`! I'm not so sure I want to refactor all the service worker registration provided by create-react-app though of course I could if I wanted to.

Fortunately there is another way, and it has the advantage of teaching us something about service workers and the problem we're faced with.

To start, it might be worth your while to study [this post](https://redfin.engineering/how-to-fix-the-refresh-button-when-using-service-workers-a8e27af6df68). You can continue without it but it's probably where I learned the most about this stuff. Buried in the comments someone posted [this](https://github.com/markvanwijnen/ServiceWorkerUpdateListener) bit of JavaScript, which does for us everything we need. We're going to use a barely-modified version of Mark's *ServiceWorkerUpdateListener.js*:

**src/ServiceWorkerUpdateListener.js**

```
/**
 * Listens for update events on ServerWorkerRegistrations
 * @version 1.1
 */
export class ServiceWorkerUpdateListener extends EventTarget {

    /**
     * Add a registration to start listening for update events
     * @param {ServiceWorkerRegistration} registration
     */
    addRegistration(registration) {
        // Make sure we have an array to hold the registrations
        if (!this._registrations) this._registrations = [];

        // Abort if we are already listening for this registration
        if (this._registrations.includes(registration)) return;

        // Add the registration to the array of registrations
        this._registrations.push(registration);

        // Add a reference to the event listener and attach it to a registration so we can remove it when needed
        var addEventListenerForRegistration = (registration, target, type, listener) => {
            if (!this._eventListeners) this._eventListeners = [];
            this._eventListeners.push({ 'registration': registration, 'target': target, 'type': type, 'listener': listener });
            target.addEventListener(type, listener);
        }

        // Convenience method to both dispatch the update event and call the relating method
        var dispatchUpdateStateChange = (state, serviceWorker, registration) => {
            var type    = 'update' + state;
            var method  = 'on' + type;
            var event   = new CustomEvent(type, { detail: { 'serviceWorker': serviceWorker, 'registration': registration } });
    
            this.dispatchEvent(event);
    
            if (this[method] && typeof this[method] === 'function') this[method].call(this, event);
        };

        // Fire the `onupdatewaiting` event if there is already a Service Worker waiting
        if (registration.waiting) dispatchUpdateStateChange('waiting', registration.waiting, registration);

        // Listen for a new service worker at ServiceWorkerRegistration.installing
        addEventListenerForRegistration(registration, registration, 'updatefound', updatefoundevent => {
            // Abort if we have no active service worker already, that would mean that this is a new service worker and not an update
            // There should be a service worker installing else this event would not have fired, but double check to be sure
            if (!registration.active || !registration.installing) return;
            
            // Listen for state changes on the installing service worker
            addEventListenerForRegistration(registration, registration.installing, 'statechange', statechangeevent => {
                // The state should be installed, but double check to make sure
                if (statechangeevent.target.state !== 'installed') return;

                // Fire the `onupdatewaiting` event as we have moved from installing to the installed state
                dispatchUpdateStateChange('waiting', registration.waiting, registration);
            });

            // Fire the `onupdateinstalling` event 
            dispatchUpdateStateChange('installing', registration.installing, registration);
        });

        // Listen for the document's associated ServiceWorkerRegistration to acquire a new active worker
        addEventListenerForRegistration(registration, navigator.serviceWorker, 'controllerchange', controllerchangeevent => {
            // Postpone the `onupdateready` event until the new active service worker is fully activated
            controllerchangeevent.target.ready.then(registration => {
                // Fire the `onupdateready` event
                dispatchUpdateStateChange('ready', registration.active, registration);
            });
        });
    }

    /**
     * Remove a registration to stop listening for update events
     * @param {ServiceWorkerRegistration} registration
     */
    removeRegistration(registration) {
        // Abort if we don't have any registrations
        if (!this._registrations || this._registrations.length <= 0) return;

        // Remove all event listeners attached to a certain registration
        var removeEventListenersForRegistration = (registration) => {
            if (!this._eventListeners) this._eventListeners = [];
            this._eventListeners = this._eventListeners.filter(eventListener => {
                if (eventListener.registration === registration) {
                    eventListener.target.removeEventListener(eventListener.type, eventListener.listener);
                    return false;
                } else {
                    return true;
                }
            });
        }

        // Remove the registration from the array
        this._registrations = this._registrations.filter(current => {
            if (current === registration) {
                removeEventListenersForRegistration(registration);
                return false;
            } else {
                return true;
            }
        });
    }

    /**
     * Force the service worker to move from waited to activating state.
     * 
     * Note: This requires the service worker script file to listen for this message, for example:
     * self.addEventListener('message', event => { if (event.data === 'skipWaiting') return skipWaiting() });
     * @param {ServiceWorker} serviceWorker 
     */
  skipWaiting(serviceWorker) {
      serviceWorker.postMessage({ type: 'SKIP_WAITING'});
  }
}
```

Import *ServiceWorkerUpdateListener.js* in App.js and add this stuff to the existing `useEffect()` call:

```
import { ServiceWorkerUpdateListener } from './ServiceWorkerUpdateListener.js'

// existing code

function App() {

// existing code ...

// add these useStates:
  const [updateWaiting, setUpdateWaiting] = useState(false);
  const [registration, setRegistration] = useState(null);
  const [swListener, setSwListener] = useState({});
  
  // new and improved useEffect()

  useEffect(async () => {
    const data = await supabaseFetch()
    if (data) setNumbers(data)

      if (process.env.NODE_ENV !== "development") {
        let listener = new ServiceWorkerUpdateListener();
        setSwListener(listener);
        listener.onupdateinstalling = (installingEvent) => {
        console.log("SW installed", installingEvent);
      };
      listener.onupdatewaiting = (waitingEvent) => {
        console.log("new update waiting", waitingEvent);
        setUpdateWaiting(true);
      };
      listener.onupdateready = (event) => {
        console.log("updateready event");
        window.location.reload();
      };
      navigator.serviceWorker.getRegistration().then((reg) => {
        listener.addRegistration(reg);
        setRegistration(reg);
      });

      return () => listener.removeEventListener();
    } else {
      //do nothing because no sw in development
    }
  }, [])
  
  // more existing code!
  }

```

If you want you can test this out. Build and serve, then hard refresh your tab however you want to do it. Click 'skipWaiting' in *Application/Service Workers* to activate the *waiting* service worker. Then make a trivial change to the app and build and serve once again. Do a normal refresh in the tab and you should see in the console the "updateinstalling" and "updatewaiting" events are being logged. We can now easily see what's going on with our service worker events! 

Inspect line 120 of *ServiceWorkerUpdateListener*:

```
skipWaiting(serviceWorker) {
      serviceWorker.postMessage({ type: 'SKIP_WAITING'});
  }
```
You see that we're given a method to tell a service worker to skip waiting. We just have to make sure to tell the *waiting* serviced worker, not the *active* one. 

All that's left to do is have the app let the user know when there is a *waiting* service worker and provide a button to click that calls `skipWaiting()` on that service worker. 

`listener.onupdateready = (event) => ...` will reload the tab when the *waiting* service worker has been made *active*. In fact it will reload all tabs that have the app loaded. This happens because all tabs open to our app are controlled by a single instance of the service worker.

Now we'll put in a simple *UpdateWaiting* component:
```
const UpdateWaiting = ({updateWaiting, handleUpdate}) => {
  if (!updateWaiting) return <></>
  return (
    <div>
      Update waiting! <button onClick={handleUpdate}>Update</button>
    </div>
  )
}
```
Render it...
```
<UpdateWaiting updateWaiting={updateWaiting} handleUpdate={handleUpdate}/>
```
And handle the button click in the `App` function:
```
const handleUpdate = () => {
   swListener.skipWaiting(registration.waiting);
  }
```

  Here's the entirety of *app.js*:

  **src/app.js**
```
import React, { useState, useEffect } from 'react';
import { ServiceWorkerUpdateListener } from './ServiceWorkerUpdateListener.js'
import { createClient } from '@supabase/supabase-js'

import './App.css';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

const supabaseFetch = async () => {
  const { data, error } = await supabase
    .from('my_set')
    .select('numbers')
    .match({ id: 1 })
  
  console.log(data, error)
  if (data) return data[0].numbers
}

const supabaseUpdate = async (value) => {
  console.log(value)
  const { data, error } = await supabase
    .from('my_set')
    .update({numbers: value})
    .match({ id: 1 })
  
  console.log(data, error)
}

function App() {
  const [numbers, setNumbers] = useState([])
  const [input, setInput] = useState('')

  const [updateWaiting, setUpdateWaiting] = useState(false);
  const [registration, setRegistration] = useState(null);
  const [swListener, setSwListener] = useState({});

  useEffect(async () => {
    const data = await supabaseFetch()
    if (data) setNumbers(data)

    if (process.env.NODE_ENV !== "development") {
      let listener = new ServiceWorkerUpdateListener();
      setSwListener(listener);
      listener.onupdateinstalling = (installingEvent) => {
        console.log("SW installed", installingEvent);
      };
      listener.onupdatewaiting = (waitingEvent) => {
        console.log("new update waiting", waitingEvent);
        setUpdateWaiting(true);
      };
      listener.onupdateready = (event) => {
        console.log("updateready event");
        window.location.reload();
      };
      navigator.serviceWorker.getRegistration().then((reg) => {
        listener.addRegistration(reg);
        setRegistration(reg);
      });

      return () => listener.removeEventListener();
    } else {
      //do nothing because no sw in development
    }
  }, [])

  const handleInput = (e) => {
    setInput(e.target.value)
  }
  const handleSubmit = () => {
    const newArray = numbers
    newArray.push(input)
    setNumbers(newArray)
    setInput('')
    supabaseUpdate(newArray)
  }

  const handleUpdate = () => {
    swListener.skipWaiting(registration.waiting);
  }

  return (
    <div className="App">
      <div>
        numbers: {numbers.length > 0 && numbers.map((number, index) => {
            if (index < numbers.length - 1) {
              return <React.Fragment key={index}>{number}, </React.Fragment>;
            } else {
              return <React.Fragment key={index}>{number}</React.Fragment>;
            }
          })}
      </div>
      <br />
      <div>
        <label for="insert">Insert: </label>
        <input id="insert" type='number' value={input} onChange={handleInput} />
        <button onClick={handleSubmit}>Submit</button>
      </div>
      <br />
      <UpdateWaiting updateWaiting={updateWaiting} handleUpdate={handleUpdate}/>
    </div>
  );
}

export default App;

const UpdateWaiting = ({updateWaiting, handleUpdate}) => {
  if (!updateWaiting) return <></>
  return (
    <div>
      Update waiting! <button onClick={handleUpdate}>Update</button>
    </div>
  )
}
```
You can checkout the branch `2-update-waiting` to get caught up with the tutorial.

`git checkout 2-update-waiting`

Build and serve the new changes and force an update by clicking 'skipWaiting'. Now make a noticible change to *app.js* and build and serve again. Do a normal refresh and you'll see *UpdateWaiting* component has rendered. If you inspect the *status* field of *Application/Service Workers* in DevTools you'll see there's an update waiting, and the console log mentions this from two files. At this point the new version of the app with the noticeable changes you just made is waiting in the wings as the *waiting* service worker.  Now click on update in the app. The app will 'Update' and you'll see the changes. *waiting* has become *active*.

### Caching fetched data

Now that our app is installable and we've given the user the ability to load the updated build assets when they've been downloaded, let's work on offline capabilities. Check the 'Offline' option in *Application/Service Workers* and click refresh.

![Offline option selected in Service Worker](/home/janssen/Documents/Tutorial/Images/offline.png  "Select 'Offline' in Service Workers menu")

We've gone over how to use Workbox in our service worker to precache our Webpack build. create-react-app actually had done this for us in the boiler-plate so it was easy! If you're anything like me you were kind of hoping the same boilerplate would magically deal with our calls to the database. Alas, we se that's not the case - now that we're offline our `numbers` array is empty. 

Fortunately Workbox gives us everything we need to cache fetched data thanks to a few modules and methods that are intuitive to grasp.

####  workbox-routing
From the Workbox [documentation](https://developers.google.com/web/tools/workbox/modules/workbox-routing):

>A service worker can intercept network requests for a page. It may respond to the browser with cached content, content from the network or content generated in the service worker. 

>workbox-routing is a module which makes it easy to "route" these requests to different functions that provide responses.

You can think of the service worker as middleware for all requests.

We will be using `registerRoute` from `workbox-routing`. Observe that CRA has given us two calls to `registerRoute` in *service-worker.js* at lines 28 and 51. The one at 28 is vital to our app and deals with 'App Shell-style' routing, which this tutorial doesn't deal with but is something we should all probably study. Line 51 deals with .png images but since our app doesn't have any images it's not doing anything.

The formula for `registerRoute` is simple. The first parameter is a matching function that returns true if the request should be handled. The second parameter is a handler which deals with the request and returns a response. This is where all the caching magic happens, and Workbox gives us a bunch of handlers that do the work for us. If you are dealing with requests that aren't the default **GET** you use the third optional parameter: a string with the request method, e.g. `'POST'`. Here's a handy infographic, courtesy of Google:
![workbox-routing diagram](/home/janssen/Documents/Tutorial/Images/workbox-routing.png  "workbox-routing diagram")

####  workbox-strategies
`workbox-strategies` is the Workbox module that contains the various route handlers. Please visit the [docs](https://developers.google.com/web/tools/workbox/modules/workbox-strategies) and learn about Stale-While-Revalidate, Cache First, Network First, Network Only, and Cache only. They're all pretty self-explanatory except for Stale-While-Revalidate. Stale-While-Revalidate is similar to what our precache of the Webpack build is doing: If there is no cache, download the assets and cache them and display them. If there is a cache display and update the cache from the network to use later.

The concepts of the strategies are simple but the programming is not simple. But actually it is simple because Workbox does the work for us and there's really nothing to it, as long as we're satisfied with the behavior of `workbox-stategies`.

#### Implementation

Add `NetworkFirst` to the import statement in *service-worker.js*.
```
import { StaleWhileRevalidate, NetworkFirst } from 'workbox-strategies';
```
Add this code to the bottom of *service-worker.js*:
```
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;

// Cache GET requests to Supabase

registerRoute(
  ({ url }) => {
    return `https://${url.host}` === supabaseUrl
  },
  new NetworkFirst({
    cacheName: "supabase-GET",
  })
);
```

Rebuild and serve, then reload the tab (make sure 'Offline' is unchecked) and update to the new version with the app's new update UI. Next check 'Offline' and refresh again. Now the numbers are displayed because the `number` array has been cached. In DevTools go to *Application/Cache/Cache Storage* and select 'supabase-GET'. This is where our new `registerRoute` cache is stored.

![Supabase Cache in DevTools](/home/janssen/Documents/Tutorial/Images/supabase-GET-cache.png  "Supabase Cache in DevTools")

The first parameter of `registerRoute()`  is a simple function that returns true if a request's URL matches our Supabase URL. The second parameter uses `NetworkFirst` from `workbox-strategies` and assigns the cache a name. The optional third parameter is skipped because `regesterRoute()` defaults to `GET` requests.

Catch your local environment up to our current progress:

`git checkout 3-supabase-GET-cache`

### Background Sync

Now that we're caching data from the database, what about data we're sending? If the user inserts new items while offline the view updates locally in the app but once they refresh the data is gone because it never got sent. This isn't proper offline behavior at all!

#### Workbox-background-sync

[workbox-background-sync](https://developers.google.com/web/tools/workbox/modules/workbox-background-sync) is easy to use and it works well. It uses the [BackgroundSync API](https://wicg.github.io/BackgroundSync/spec/) and [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) to keep a local cache of requests and send them out when the browser goes online. 

In the service worker we need to import `BackgroundSyncPlugin` from `workbox-background-sync`. We also need the `NetworkOnly` strategy from `workbox-strategies`. Import that stuff and add some code to the bottom of *service-worker.js*:

**service-worker.js**
```
// imports
import { StaleWhileRevalidate, NetworkFirst, NetworkOnly } from 'workbox-strategies';
import { BackgroundSyncPlugin } from "workbox-background-sync";

// existing service worker code ...

//
//

// Background sync PATCH requests to Supabase

const bgSyncPlugin = new BackgroundSyncPlugin("PATCH-que", {
  maxRetentionTime: 24 * 60,
});

registerRoute(
  ({ url }) => {
    return `https://${url.host}` === supabaseUrl
  },
  new NetworkOnly({
    plugins: [bgSyncPlugin],
  }),
  "PATCH"
);
```

We use `registerRoute` and match the Supabase URL just like we did with the **GET** cache. Notice the third parameter for `registerRoute` is `"PATCH"` which differentiates this route from the other which defaults to `"GET"`. For the handler we use the `NetworkOnly` strategy with the plugin `BackgroundSyncPlugin` to which we assign a day's worth of minutes to the option `maxRetentionTime`, which is self-explanatory. 

Run buildnserve and update the app in your browser. Under *Application/Application/Service Workers* in DevTools click 'Offline'. Under *Background Services/Sync* click the red circle to record background sync events. Now insert a number or two in the app. Under *Storage/IndexedDB* the queued up requests are kept in *workbox-background-sync*. After you unselect 'Offline' those requests will go through and you can see all these events that have been recorded in *Background Services/Background Sync*.

![background-sync cache](/home/janssen/Documents/Tutorial/Images/background-syc.png  "background-sync cache")

Now when you refresh the app the new items will be kept because they're not just being rendered in the app, but they've actually been sent to the database thanks to *BackgroundSync*. 

You can checkout to our current progress:
`git checkout 4-background-sync`.

### Conclusion
That's the basics for a PWA with the necessary offline features. It turns out there's a lot more to a PWA than a *manifest.json* that allows for installability, and Workbox does a lot of the work for us.