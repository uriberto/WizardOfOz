<script context="module">
	export const prerender = true;
</script>

<script>
	import { goto} from '$app/navigation';
</script>

<svelte:head>
	<title>Wizard Of Oz Illustrations</title>
</svelte:head>

<div class="hero min-h-screen bg-base-200">
	<div class="flex-col hero-content lg:flex-row-reverse">
		<img src="/WizardOfOz/Images/Wonderful%20Wizard%20Of%20Oz/i075_edit.jpg" class="max-w-sm rounded-lg shadow-2xl"> 
		<div>
			<h1 class="mb-5 text-5xl font-bold">
				Wizard Of Oz Illustrations
				</h1> 
			<p class="mb-5">
				This site gathers together the illustrations from the classic L. Frank Baum book series including: The Wonderful Wizard of Oz,
				The Marvelous Land of Oz, Ozma of Oz, Dorothy and the Wizard in Oz, The Road to Oz, The Emerald City of Oz, The Patchwork Girl of Oz,
				Tik-Tok of Oz, The Scarecrow of Oz, Rinkitink in Oz, The Lost Princess of Oz, The Tin Woodman of Oz, The Magic of Oz, 
				and Glinda of Oz.
			</p> 
			<p class="mb-7">
				This site made with love for my little tin woodman, scarecrow, and cowardly lion. 
			</p>
			<div class="flex flex-row items-center justify-center gap-3">
				<button on:click={()=>goto('byBook')} class="btn btn-primary">Books</button><button on:click={()=>goto('byCharacter')} class="btn btn-primary">Characters</button>
			</div>
		</div>
	</div>
  </div>
