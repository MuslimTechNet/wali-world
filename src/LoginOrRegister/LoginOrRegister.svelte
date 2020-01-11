<script>
    import axios from 'axios';
    import AjaxForm from '../AjaxForm.svelte';


    import {createEventDispatcher} from 'svelte';
    const dispatcher = createEventDispatcher();
    export let loginUrl;
    export let emailCheckUrl;
    export let registerUrl;

    export let loginErrors;
    export let registerErrors;
    export let confirmPasswordErrors;

    const LOGIN_REGISTER = 'LOGIN_REGISTER';
    const LOGIN_SUCCESS = 'LOGIN_SUCCESS';
    const CONFIRM_PASSWORD = 'CONFIRM_PASSWORD';
    const REGISTER_SUCCESS = 'REGISTER_SUCCESS';

    const screenStates = [LOGIN_REGISTER,LOGIN_SUCCESS,CONFIRM_PASSWORD,REGISTER_SUCCESS]
    
    let currentScreen = LOGIN_REGISTER;

    let email = '';
    let password = '';
    let passwordConfirmation = '';
    let verifyPassword = '';
    let errors = [];
    let confirmPasswordScreen = false;
    let verifyEmailScreen = false;
    
    function login(){

        errors = [];
        axios.post(loginUrl,{
            ['contact-info']:email,
            password:password
        },{
            withCredentials:true
        }).then(e=>{

            loginErrors.forEach(error=>{
                const err = error(e);
                if (err) errors = [...errors,err]
            })

            if (!errors.length){
                currentScreen = LOGIN_SUCCESS;
                dispatcher('login');
            }

        })
    }

    function register(){
        if (!email.length) errors=[...errors,'Please enter an email'];
        if (!password.length) errors=[...errors,'Please enter a password'];

        axios.post(emailCheckUrl,{
            email
        },{
            withCredentials:true
        }).then(e=>{
            registerErrors.forEach(error=>{
                const err = error(e);
                if (err) errors = [...errors,err];

                if (!errors.length){
                    currentScreen = CONFIRM_PASSWORD;
                }
            })
        })



        
        
    }

    function confirmPassword(){
        if (!passwordConfirmation) errors = [...errors,'Please confirm your password'];
        else if (password!==passwordConfirmation) errors = [...errors,'Passwords do not match'];
        else{
                    axios.post(registerUrl,{
            ['contact-info']:email,
            password:password
        },{
            withCredentials:true
        }).then(e=>{
            console.log(e)

            confirmPasswordErrors.forEach(error=>{
                const err = error(e);
                if (err) errors = [...errors,err]
            })
            if (!errors.length){
                currentScreen = REGISTER_SUCCESS;
            }
        })
        }

    }
</script>
<style>
    div.loginOrRegister{
        width:300px;
    }
    label{
        display:flex;
        justify-content:space-between;
        margin-bottom:5px;
    }
    div.error{
        background:red;
    }
</style>

<div class='loginOrRegister'>
    {#if currentScreen == LOGIN_REGISTER}
         <label>
        E-mail
        <input bind:value={email} on:keydown={()=>{
            errors=[];
        }}/>
    </label>
    <label>
        Password
        <input type="password" bind:value={password} on:keydown={()=>{
            errors=[];
        }}/>
    </label>
    {:else if currentScreen == LOGIN_SUCCESS}
        Login success!
    {:else if currentScreen == CONFIRM_PASSWORD}
        <label>
            Confirm Password
            <input type="password" bind:value={passwordConfirmation} on:keydown={()=>{
                errors=[];
            }}/>
        </label>
    {:else if currentScreen == REGISTER_SUCCESS}
        We are sending a verification email.
    {/if}
    
    {#each errors as error}<div class='error'>{error}</div>{/each}
    {#if currentScreen == CONFIRM_PASSWORD} <button on:click={confirmPassword}>Confirm</button> <button on:click={()=>{currentScreen=LOGIN_REGISTER}}>Back</button>
    {:else if currentScreen == LOGIN_REGISTER}<button on:click={login}>Login</button> or <button on:click={register}>Register</button>
    {/if}
</div>
