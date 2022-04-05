<script>
	import Image from "svelte-image";
	import { goto} from '$app/navigation';
	export let link;
	export let src="/WizardOfOz/Images/Wonderful Wizard Of Oz/0001v.jpg";
	export let charname;
	export let alt
	function link_click(){
		if(link) goto(link);
	}
</script>

{#if charname}

	<a href="{link}" class="card bordered xlg:w-1/5 lg:w-1/4 md:w-1/3 sm:w-full px-2 mb-4">
		<figure>
			<img src="{src}" loading="lazy" alt="{alt}"/>
		</figure> 
		<div class="card-body">
			<h2 class="card-title text-center">
				{charname}
			</h2> 
		</div>
	</a> 

{:else}
	<a href="{link}" rel="{link.endsWith("jpg")||link.endsWith('png')||link.endsWith('jpeg') ? "external" : ''}" class="xlg:w-1/5 lg:w-1/4 md:w-1/3 sm:w-full xs:w-full px-2 mb-4 rounded-3xl ">
		<img src="{src}" loading="lazy" alt="{alt}"/>
	</a>
{/if}