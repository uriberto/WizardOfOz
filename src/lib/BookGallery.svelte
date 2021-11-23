<script>
    import ImgItem from '$lib/ImgItem.svelte';
    import {img_list, directory, title} from '$lib/api/file_list.js';
    export let slug;
</script>

<h1 class="p-10">{title(slug)}</h1>

<div class="flex flex-wrap -mb-4 container mx-auto">
    {#each img_list(slug) as file}
        <ImgItem src={directory(slug)+'/'+file} link={directory(slug)+'/'+file}/>
    {/each}

</div>
