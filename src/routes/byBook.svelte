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
	import Header from '$lib/header/Header.svelte';
</script>

<svelte:head>
	<title>Wizard Of Oz Books</title>
</svelte:head>

<h1 class="p-10">The Wizard Of Oz Books</h1>

<div class="flex flex-wrap -mb-4 container mx-auto">
  
	<ImgItem link="book/twwoo" title="The Wonderful Wizard Of Oz" src="/WizardOfOz/Images/Wonderful%20Wizard%20Of%20Oz/i001_edit.jpg"/>
	<ImgItem link="book/tmloo" title="The Marvelous Land of Oz" src="/WizardOfOz/Images/Marvelous Land Of Oz Images/cover.jpeg"/>
	<ImgItem link="book/ooo" title="Ozma of Oz" src="/WizardOfOz/Images/Ozma Of Oz/cover.jpg"/>
	<ImgItem link="book/datwio" title="Dorothy and the Wizard in Oz" src="/WizardOfOz/Images/Dorothy And The Wizard In Oz/cover.jpeg"/>
	<ImgItem link="book/trto" title="The Road to Oz" src="/WizardOfOz/Images/The Road To Oz/cover.jpg"/>
	<ImgItem link="book/tecoo" title="The Emerald City of Oz" src="/WizardOfOz/Images/The Emerald City of Oz/cover.jpg"/>
	
	<ImgItem link="book/tpgoo" title="The Patchwork Girl of Oz" src="/WizardOfOz/Images/The Patchwork Girl Of Oz/cover.jpg"/>
	<ImgItem link="book/ttoo" title="Tik-Tok of Oz" src="/WizardOfOz/Images/Tik-tok Of Oz/cover.jpg"/>
	<ImgItem link="book/tsoo" title="The Scarecrow of Oz" src="/WizardOfOz/Images/The Scarecrow of Oz/cover2.jpg"/>

	<ImgItem link="book/rio" title="Rinkitink in Oz" src="/WizardOfOz/Images/Rinkitink in Oz/cover.jpg"/>

	<ImgItem link="book/tlpoo" title="The Lost Princess of Oz" src="/WizardOfOz/Images/The Lost Princess of Oz/i_cover.png"/>
	<ImgItem link="book/ttwoo" title="The Tin Woodman of Oz" src="/WizardOfOz/Images/The Tin Woodman of Oz/icover.jpg"/>
	<ImgItem link="book/tmoo" title="The Magic of Oz" src="/WizardOfOz/Images/The Magic of Oz/cover.jpg"/>
	<ImgItem link="book/goo" title="Glinda of Oz" src="/WizardOfOz/Images/Glinda Of Oz/cover.jpg"/>

</div>

