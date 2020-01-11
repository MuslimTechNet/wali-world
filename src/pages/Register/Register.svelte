<script>
    import Frame from '../../Frame/Frame.svelte';
</script>
<style></style>
<Frame>
 <form action="/register/submit" method="post">
                <label>
                    Name
                    <input name="name" maxlength="1000"/>
                </label>
                <label>
                    Contact Info (phone, email, twitter, whatever you want)
                    <input name="contact-info" maxlength="500"/>
                </label>
                <label>
                    Password
                    <input name="password" maxlength="500" type="password"/>
                </label>

               <button>Submit</button>
            </form>
</Frame>
