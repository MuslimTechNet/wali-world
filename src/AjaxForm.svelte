<script>
    import axios from 'axios';
    import {createEventDispatcher} from 'svelte';
    const dispatch = createEventDispatcher();

    export let action;
    export let customErrorDetection;
    export let values;

    function handleSubmit(){
        axios.post(action,values).then((e)=>{
            if (customErrorDetection(e)) dispatch('error');
            dispatch('success');
        })
    }

    function handleError(){

    }

</script>
<form on:submit|preventDefault={handleSubmit}>
    <slot></slot>
</form>
