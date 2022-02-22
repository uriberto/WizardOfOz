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
	
	import {characterlist, goodguys, badguys, charactername, humans, ozites, abm, animals, witches, vfs} from '$lib/api/character_file_lists.js';

	import Select from 'svelte-select';
	let items=['all','good guy', 'bad guy'];
	let natures = ['all','humans','ozites','alive by magic','animals','witches','various fairies']
	let filteredcharacterlist = characterlist;
	let goodnesslist = characterlist;
	let naturelist = characterlist;

	function filterTheCharList(event){
		switch(event.detail.value){
			case 'all':
				goodnesslist = characterlist;
				break;
			case 'good guy': 
				goodnesslist = goodguys;
				break;
			case 'bad guy':
				goodnesslist = badguys;
				break;
			default:
				goodnesslist = characterlist
		}
	}

	function filterByNature(event){
		switch(event.detail.value){
			case 'all':
				naturelist = characterlist;
				break;
			case 'humans': 
				naturelist = humans;
				break;
			case 'ozites': 
				naturelist = ozites;
				break;
			case 'alive by magic':
				naturelist = abm;
				break;
			case 'animals':
				naturelist = animals;
				break;
			case 'witches':
				naturelist = witches;
				break;
			case 'various fairies':
				naturelist = vfs;
				break;
			default:
				naturelist = characterlist
		}
	}

	$:filteredcharacterlist = characterlist.filter(x=>goodnesslist.includes(x) && naturelist.includes(x))

</script>


<svelte:head>
	<title>Wizard Of Oz Characters</title>
</svelte:head>

<h1 class="p-10">The Wizard Of Oz Characters</h1>

<form class="text-black content-center m-5">
	<label for="goodBad">Select Category:</label>
	<Select id="goodBad" {items} on:select={filterTheCharList}></Select>
</form>

<form class="text-black content-center m-5">
	<label for="nature">Select Category:</label>
	<Select id="nature" items={natures} on:select={filterByNature}></Select>
</form>

<div class="section flex flex-wrap -mb-4 container mx-auto">
  
	{#each filteredcharacterlist as character}
		<ImgItem link={"/character/"+character} charname="{charactername(character)}" src={"/WizardOfOz/Images/Characters/"+character+".jpg"}/>
	{:else}
		<div>No such character found.</div>
	{/each}
	

</div>

