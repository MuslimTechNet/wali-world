<script>
    import Frame from '../../Frame/Frame.svelte';
    import LoginOrRegister from '../../LoginOrRegister/LoginOrRegister.svelte';
    import MakeAProfileForm from '../../MakeAProfileForm/MakeAProfileForm.svelte';
    let iam = 'Man';
    let lookingFor = 'Wali'
    let makeAProfileClicked = false;

    $:{
        lookingFor = iam=='Man'?'Wali':'Man';
    }
    let loggedIn = false;
    
    let profileSubmitted = false;
         
</script>
<style>
.make-a-profile{
        display: flex;
    flex-direction: column;
    align-items: center;
}

</style>
<Frame on:loggedIn={()=>{
    loggedIn = true;
}}>
<form action='/profiles' >
    <div class='i-am'>
        <label for="i-am">I am a</label>
        <select id='i-am' name="i-am" bind:value={iam}>
            <option value='Man'>Man</option>
            <option value='Wali'>Wali</option>
        </select> 
        <label for="looking-for" name="looking-for">looking for a </label>
        <select id='looking-for' bind:value={lookingFor}>
            <option value='Man'>Man</option>
            <option value='Wali'>Wali</option>
        </select>
    </div>
    <div class='search'>
        <button>Search!</button>
    </div>
    </form>
<div class='or'>-- Or --</div>
<div class='make-a-profile'>
    {#if makeAProfileClicked}
        {#if loggedIn}
            {#if profileSubmitted}
                Thank you for submitting!
                <a href="/profiles">See all profiles</a>
            {:else}
                <MakeAProfileForm on:submitSuccess={e=>{
                    profileSubmitted = true;
                }} on:submitError={e=>{

                }}/>
            {/if}
        {:else}
            <LoginOrRegister 
                loginUrl={'/login/submit'} 
                emailCheckUrl={'/emailcheck'}
                registerUrl={'/register/submit'}
                
                loginErrors={[
                    e=>e.data=='This user does not exist'?e.data:false,
                    e=>e.data=='The password is incorrect'?e.data:false,
                    e=>e.data=='A weird error was thrown'?e.data:false
                ]}
                registerErrors={[
                    e=>{return e.data=='Username is taken'?e.data:false}
                ]}
                confirmPasswordErrors={[
                    e=>{return e.data=='A weird error was thrown'?e.data:false}
                ]}

                on:login={e=>{
                    loggedIn = true;
                }}

            />
        {/if}
    {:else}
        
    

        <button on:click={()=>makeAProfileClicked = true}>Make a profile</button>
        <div>So that others can search for you!</div>
    {/if}
    
</div>
</Frame>
