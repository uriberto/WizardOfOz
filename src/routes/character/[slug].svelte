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
    import {book_list, title, directory} from '$lib/api/book_file_list';
    import {character_book_img_list, charactername} from '$lib/api/character_file_lists.js';
    export let slug;
</script>

<h1 class="p-10">{charactername(slug)}</h1>

{#each book_list as book}
    {#if character_book_img_list(slug,book) && character_book_img_list(slug,book).length}

    <div class="container mx-auto m-10">
        <h2 class="text-2xl ml-4">Illustrations from {title(book)}</h2>
    </div>

        <div class="flex flex-wrap -mb-4 container mx-auto">
            {#each character_book_img_list(slug,book) as file}
                <ImgItem src={'/'+directory(book)+'/'+file} rel="external" link={'/image/'+book+'/'+file+'.html'}/>
            {/each}

        </div>
    {/if}
{/each}




