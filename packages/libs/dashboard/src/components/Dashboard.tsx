import React, {useState} from "react";
import {Button} from "react-bootstrap";

export default function Dashboard({children} : {children : React.ReactNode}) {
  // nav open/close state
  const [topNavOpen, setTopNavOpen] = useState(false);
  // render
  return (
    <div className='App'>
      <div className='Main'>
        <div className='Content'>
          {children}
        </div>
        <div className='Footer text-muted'>
          Copyright
        </div>
      </div>
      <div className='Topbar d-flex justify-content-between'>
        <h3 className='Title'>Title</h3>
        <div className='d-inline-block d-sm-none float-right'>
          <Button
            className='toggle-button'
            variant='outline-secondary'
            onClick={() => setTopNavOpen(!topNavOpen)}
          >

          </Button>
        </div>
      </div>
      <div className={`TopNav d-${topNavOpen ? 'block' : 'none'}`}>
        <hr/>
        {/*<Nav config={navigation} />*/}
      </div>
      <div className='Sidebar'>
        <div className='Logo'>
          <h1></h1>
        </div>
        <div className='Logo small'>
          <h3></h3>
        </div>
        {/*<Nav config={navigation} />*/}
      </div>
    </div>
  )

}