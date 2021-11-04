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
    setNumbers(data)

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
        numbers: {numbers.map((number, index) => {
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