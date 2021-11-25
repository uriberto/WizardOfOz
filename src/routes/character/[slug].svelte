<script context="module">
    export async function load({page , fetch, session, stuff}){
        console.log({page})
        return {
            props:{
                slug:page.params.slug
            }
        }
    }
</script>

<script>
    import ImgItem from '$lib/ImgItem.svelte';
    import {book_list, title, character_book_img_list, charactername, directory} from '$lib/api/file_list.js';
    export let slug;

</script>

<h1 class="p-10">{charactername(slug)}</h1>

{#each book_list as book}
    {#if character_book_img_list(slug,book).length}

    <div class="container mx-auto m-10">
        <h2 class="text-2xl ml-4">Illustrations from {title(book)}</h2>
    </div>

        <div class="flex flex-wrap -mb-4 container mx-auto">
            {#each character_book_img_list(slug,book) as file}
                <ImgItem src={'/'+directory(book)+'/'+file} link={'/'+directory(book)+'/'+file}/>
            {/each}

        </div>
    {/if}
{/each}




