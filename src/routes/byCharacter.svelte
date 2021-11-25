<script context="module">
	import { browser, dev } from '$app/env';

	// we don't need any JS on this page, though we'll load
	// it in dev so that we get hot module replacement...
	export const hydrate = dev;

	// ...but if the client-side router is already loaded
	// (i.e. we came here from elsewhere in the app), use it
	export const router = browser;

	// since there's no dynamic data here, we can prerender
	// it so that it gets served as a static asset in prod
	export const prerender = true;
</script>

<script>
	import ImgItem from '$lib/ImgItem.svelte';
	
	import {characterlist, charactername} from '$lib/api/character_file_lists.js';
</script>

<svelte:head>
	<title>Wizard Of Oz Characters</title>
</svelte:head>

<h1 class="p-10">The Wizard Of Oz Characters</h1>

<div class="flex flex-wrap -mb-4 container mx-auto">
  
	{#each characterlist as character}
		<ImgItem link={"character/"+character} charname="{charactername(character)}" src={"/WizardOfOz/Images/Characters/"+character+".jpg"}/>
	{/each}
	

</div>

