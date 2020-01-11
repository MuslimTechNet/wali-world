
<script>

    import axios from 'axios';
    
    let isLoggedIn = false;
    
    import { onMount,createEventDispatcher } from 'svelte';
    const dispatch = createEventDispatcher();

    onMount(()=>{
        axios.get('/isLoggedIn').then(res=>{
            console.log(res);
            isLoggedIn = JSON.parse(res.data); //fancy way of converting "true" to true and "false" to false
            if (isLoggedIn) dispatch('loggedIn');
        });
    })

</script>
        <style>
            a.link{
                color: inherit; /* blue colors for links too */
                text-decoration: inherit; /* no underline */
            }

            div.nga{
    max-width:200px;
    margin-left:auto;
    margin-right:auto;
}

div.nga img{
    width:100%;
    
}

        </style>
        <header>            
            <h1><a href="/" class='link'>Wali</a></h1>    
            <p class='deck'> Welcome to wali<span class='dotfamily'>.family</span>, a service with a different vision for Islamic marriages.</p>   
        </header>
        <section class='main'>
            <slot></slot>
        </section>
        <footer>
            <div class="nga">
                <img alt="No girls allowed" src="./img/nga.png"/>
                {#if isLoggedIn}<a href="/logout">Logout</a>{:else}You are not logged in {/if}
            </div>
        </footer>

