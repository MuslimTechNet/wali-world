<script>
    import Frame from '../../Frame/Frame.svelte';
</script>
<style></style>
<Frame>
            <form action="/login/submit" method="post">
               
                <label>
                    Contact Info
                    <input name="contact-info" maxlength="500"/>
                </label>
                <label>
                    Password
                    <input name="password" maxlength="500" type="password"/>
                </label>

               <button>Submit</button>
            </form>
</Frame>
