import Index from './pages/Index/Index.svelte';
import Login from './pages/Login/Login.svelte';
import Email from './pages/Email/Email.svelte';
import MakeProfile from './pages/MakeProfile/MakeProfile.svelte';
import Register from './pages/Register/Register.svelte';
import Profiles from './pages/Profiles/Profiles.svelte';


const page = ({
    '/':Index,
    '/doit':Index,
    '/login':Login,
    '/email':Email,
    '/make-profile':MakeProfile,
    '/profiles':Profiles,
    '/register':Register
})[window.location.pathname];

const app = new page({
    target: document.querySelector('#app')
});

export default app;
