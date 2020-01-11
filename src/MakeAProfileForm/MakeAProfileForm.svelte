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
<script>
    import AjaxForm from '../AjaxForm.svelte';
    import {createEventDispatcher} from 'svelte';
    const dispatch = createEventDispatcher();
    function handleSuccess(){
        dispatch('submitSuccess');
    }

    function handleError(){
       dispatch('submitError');
    }

    let name = '';
    let descriptionofyou='';
    let descriptionofspouse='';


</script>
 <AjaxForm action="/make-profile/submit" values={{name,descriptionofyou,descriptionofspouse}} on:success={handleSuccess} on:error={handleError} customErrorDetection={e=>{
     return e.data==='A weird error was thrown'
 }}>
                <div>
                    <div class='youare'>You are:</div>
                    <label><input type="radio" name="youare" value="searchingforwife">Searching for a wife<br></label>
                    <label><input type="radio" name="youare" value="wali">A wali searching for a suitor<br></label>
                </div>
                <label>
                    Name
                    <input name="name" bind:value={name}/>
                </label>
                <label>
                    <div>Description of yourself or the sister you are trying to marry off</div>
                    <textarea name="descriptionofyou" placeholder="location, religiosity, culture, vague description of looks, personality" bind:value={descriptionofyou}></textarea>
                </label>
                <label>
                        <div>Description of what you are looking for in a spouse</div>
                        <textarea name="descriptionofspouse" placeholder="location, religiosity, culture, vague description of looks, personality" bind:value={descriptionofspouse}></textarea>
                    </label>
               <button>Submit</button>
            </AjaxForm>
