<script>
    import Frame from '../../Frame/Frame.svelte';
    import axios from 'axios';
    let to='', message='';

    function send_email(){
        axios.get('/send',{
            params:{
                to
            }
        }).then(function (response) {
             if(response.data=="sent"){
                 message = `Email is been sent at ${to} . Please check inbox !`;
                
            }
        })
    }
    

</script>

<style>
#container
{
    margin-left:400px;
    margin-top:50px;
}
#to,#subject,#content
{
    font-family: "Segoe UI";
    font-size:18px;
    width:530px;
}
h1
{
    font-family: "Segoe UI";
    font-size:40px;
    color: #3b5998;
}
p
{
    color:green;
}
#send_email
{
    font-size:15px;
    font-family: "Segoe UI";
}
#message
{
    font-size:18px;
}
</style>
<Frame>
<div id="container">
<h1>Email-verification System in Node.js</h1>
<input type="text" id="to" bind:value={to} placeholder="Enter E-mail which you want to verify"><br>
<button id="send_email" on:click={send_email}>Send Email</button><br>
<span id="message">{message}</span>
</div>
</Frame>
