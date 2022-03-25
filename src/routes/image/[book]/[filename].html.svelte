<script context="module">
    export async function load({page , fetch, session, stuff}){
        console.log({page})
        return {
            props:{
                book:page.params.book,
                filename:page.params.filename
            }
        }
    }
</script>

<script>
    import ImgItem from '$lib/ImgItem.svelte';
    export let book;
    export let filename;
    let file = filename;
    import {book_list, title, directory} from '$lib/api/book_file_list';
    import {character_book_img_list, charactername, characterlist} from '$lib/api/character_file_lists.js';
    let charactersInImage = characterlist.filter(x=> character_book_img_list(x,book)?.includes(filename))

</script>

<a href="{'/'+directory(book)+'/'+file}" rel="external">
<img src={'/'+directory(book)+'/'+file} rel="external"/>
</a>
<br><br>

This image is from the book: <a href="/book/{book}">{title(book)}</a> <br><br>

Characters: {#each charactersInImage as character,i}
<a href="/character/{character}">{charactername(character)}</a>{#if i+1<charactersInImage.length},&nbsp;{/if} 
{/each}

<br><br>

