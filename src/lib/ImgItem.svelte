<script>
	import { goto} from '$app/navigation';
	export let link;
	export let src="/WizardOfOz/Images/Wonderful Wizard Of Oz/0001v.jpg";
	export let charname;
	function link_click(){
		if(link) goto(link);
	}
</script>

{#if charname}

	<a href="{link}" class="card bordered xlg:w-1/5 lg:w-1/4 md:w-1/3 sm:w-1/2 px-2 mb-4">
		<figure>
			<img src="{src}">
		</figure> 
		<div class="card-body">
			<h2 class="card-title text-center">
				{charname}
			</h2> 
		</div>
	</a> 

{:else}
	<a href="{link}" rel="{link.endsWith("jpg")||link.endsWith('png') ? "external" : ''}" class="xlg:w-1/5 lg:w-1/4 md:w-1/3 sm:w-1/2 px-2 mb-4">
		<img style="width:100%;height:auto;" class="rounded-3xl " class:cursor-pointer={link} src="{src}"/>
	</a>
{/if}