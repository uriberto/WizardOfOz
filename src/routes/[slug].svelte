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
    export let slug;
    import BookGallery from '$lib/BookGallery.svelte'
</script>

<BookGallery {slug} />




