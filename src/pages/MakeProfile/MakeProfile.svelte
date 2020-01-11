<script>
    import Frame from '../../Frame/Frame.svelte';
</script>
<style>
.youare{
    margin-bottom:5px;
}

form>*{
    display:block;
    margin-bottom:15px;
}

textarea{
    width:100%;
    max-width:500px;
    height:300px;
}


</style>
<Frame>
 <form action="/make-profile/submit" method="post">
                <div>
                    <div class='youare'>You are:</div>
                    <label><input type="radio" name="youare" value="searchingforwife">Searching for a wife<br></label>
                    <label><input type="radio" name="youare" value="wali">A wali searching for a suitor<br></label>
                </div>
                <label>
                    Name
                    <input name="name"/>
                </label>
                <label>
                    <div>Description of yourself or the sister you are trying to marry off</div>
                    <textarea name="descriptionofyou" placeholder="location, religiosity, culture, vague description of looks, personality"></textarea>
                </label>
                <label>
                        <div>Description of what you are looking for in a spouse</div>
                        <textarea name="descriptionofspouse" placeholder="location, religiosity, culture, vague description of looks, personality"></textarea>
                    </label>
               <button>Submit</button>
            </form>
</Frame>
