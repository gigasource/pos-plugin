<template>
	<div class="view-category-wrapper">
		<g-simple-table striped>
			<tr>
			<th>{{$t('article.name')}}</th>
				<th>{{$t('settings.position')}}</th>
			</tr>
			<tr v-for="category in listCategories" :class="[(selectedCategory && selectedCategory._id === category._id) && 'bordered']" @click="select(category)">
				<td>{{category.name}}</td>
				<td>{{category.position}}</td>
			</tr>
		</g-simple-table>
		<div class="category-menu--preview">
			<div v-for="category in listCategories" :key="`${category._id}`"
					 :class="['menu', (selectedCategory && selectedCategory._id === category._id) && 'menu__active']"
					 @click="select(category)">
				{{category.name}} ({{category.position}})
			</div>
		</div>
	</div>
</template>

<script>
  export default {
    name: 'viewCategory',
    injectService: [
      'SettingsStore:listCategories',
      'SettingsStore:selectedCategory',
      'SettingsStore:getAllCategories',
    ],
		data() {
    	return {
				listCategories: [],
				selectedCategory: null
			}
		},
    async created() {
      this.listCategories = await this.getAllCategories();
    },
		beforeDestroy() {
    	this.selectedCategory = null;
		},
    methods: {
      select(category) {
        this.selectedCategory = category;
      },
			getAllCategories() {}
    }
  }
</script>

<style scoped lang="scss">
	.view-category-wrapper {
		display: flex;
		flex-direction: column;
		height: 100%;

		.g-table {
			flex: 1;

			tr th {
				color: #1d1d26;
				text-align: left;
				font-size: 14px;
				line-height: 18px;
			}

			th, td {
				padding-left: 32px;

				&:nth-child(2) {
					width: 30%;
					text-align: center;
				}
			}

			td {
				height: 32px;
			}

			&.g-data-table__striped {
				tr:nth-child(even) {
					background-color: #f2f2f2
				}

				tr:nth-child(odd):not(:first-child) {
					background-color: white;
				}
			}

			.bordered > td {
				border: 2px solid #1271ff;

				&:first-child {
					border-right: none;
					padding-left: 30px;
				}

				&:last-child {
					border-left: none;
					padding-left: 34px;
				}
			}
		}

		.category-menu--preview {
			background-color: #90CAF9;
			overflow-x: auto;
			display: grid;
			grid-template-rows: 40px 40px;
			grid-auto-columns: 32.8%;
			grid-gap: 6px;
			grid-auto-flow: column;
			padding: 6px;

			&::-webkit-scrollbar {
				display: none;
			}

			.menu {
				background-color: #fff;
				color: #1d1d26;
				height: 100%;
				display: flex;
				align-items: center;
				justify-content: center;
				text-align: center;
				cursor: pointer;

				&__active {
					background-color: #2979FF !important;
					color: white !important;
				}
			}

			&:after {
				content: '';
				width: 1px;
				height: 100%;
			}
		}
	}
</style>
