<script>
    import Frame from '../../Frame/Frame.svelte';
    import axios from 'axios';
    
    let profiles = {
        suitorProfiles:[],
        waliProfiles:[]
    };

    axios.get('/api/profiles').then(results=>{
        console.log(results.data);
        profiles = results.data;
    }).catch()

</script>
<style>

h2{
    text-align:center;
}

.profiles{
    display:flex;
    flex-wrap:wrap;
}

.profile{
    box-sizing:border-box;
    width:50%;
    border:1px solid white;
    padding:3px;
}

</style>
<Frame>
    <div class='profiles'>
        {#each profiles.suitorProfiles as profile}
            <div class='profile'>
                <h2>Bio</h2>
                <p>{profile.bio}</p>
                <h2>Looking for</h2>
                <p>{profile.looking_for}</p>
            </div>
        {/each}
        {#each profiles.waliProfiles as profile}
            <div class='profile'>
                <h2>Bio</h2>
                <p>{profile.bio}</p>
                <h2>Looking for</h2>
                <p>{profile.looking_for}</p>
            </div>
        {/each}
    </div>
</Frame>
