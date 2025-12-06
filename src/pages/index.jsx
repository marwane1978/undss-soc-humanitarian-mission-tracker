import Layout from "./Layout.jsx";

import Dashboard from "./Dashboard";

import Countries from "./Countries";

import SRMZones from "./SRMZones";

import Missions from "./Missions";

import NewMission from "./NewMission";

import MissionDetails from "./MissionDetails";

import NewSegment from "./NewSegment";

import SegmentDetails from "./SegmentDetails";

import Reports from "./Reports";

import SOCPerformance from "./SOCPerformance";

import Notifications from "./Notifications";

import UserProfiles from "./UserProfiles";

import Chat from "./Chat";

import Calendar from "./Calendar";

import TourFAQ from "./TourFAQ";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Dashboard: Dashboard,
    
    Countries: Countries,
    
    SRMZones: SRMZones,
    
    Missions: Missions,
    
    NewMission: NewMission,
    
    MissionDetails: MissionDetails,
    
    NewSegment: NewSegment,
    
    SegmentDetails: SegmentDetails,
    
    Reports: Reports,
    
    SOCPerformance: SOCPerformance,
    
    Notifications: Notifications,
    
    UserProfiles: UserProfiles,
    
    Chat: Chat,
    
    Calendar: Calendar,
    
    TourFAQ: TourFAQ,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Dashboard />} />
                
                
                <Route path="/Dashboard" element={<Dashboard />} />
                
                <Route path="/Countries" element={<Countries />} />
                
                <Route path="/SRMZones" element={<SRMZones />} />
                
                <Route path="/Missions" element={<Missions />} />
                
                <Route path="/NewMission" element={<NewMission />} />
                
                <Route path="/MissionDetails" element={<MissionDetails />} />
                
                <Route path="/NewSegment" element={<NewSegment />} />
                
                <Route path="/SegmentDetails" element={<SegmentDetails />} />
                
                <Route path="/Reports" element={<Reports />} />
                
                <Route path="/SOCPerformance" element={<SOCPerformance />} />
                
                <Route path="/Notifications" element={<Notifications />} />
                
                <Route path="/UserProfiles" element={<UserProfiles />} />
                
                <Route path="/Chat" element={<Chat />} />
                
                <Route path="/Calendar" element={<Calendar />} />
                
                <Route path="/TourFAQ" element={<TourFAQ />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}