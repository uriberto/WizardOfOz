<script>
	import { goto} from '$app/navigation';
	export let link;
	export let src="/WizardOfOz/Images/Wonderful Wizard Of Oz/0001v.jpg";

	function link_click(){
		if(link) goto(link);
	}
</script>

<a href="{link}" class="xlg:w-1/5 lg:w-1/4 md:w-1/3 sm:w-1/2 px-2 mb-4">
	<img style="width:100%;height:auto;" class="rounded-3xl " class:cursor-pointer={link} src="{src}"/>
</a>