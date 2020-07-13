<template>
	<div class="row-flex pa-5" style="font-size: 13px; line-height: 16px">
		<div class="col-5 px-3">
			<div class="row-flex align-items-center justify-between">
				<span>{{$t('settings.companyBarcode')}}</span>
				<g-switch v-model="barcode" @change="changeSetting"/>
			</div>
			<div class="row-flex align-items-center justify-between">
				<span>{{$t('settings.showFav')}}</span>
				<g-switch v-model="favoriteArticle" @change="changeSetting"/>
			</div>
			<div class="row-flex align-items-center justify-between">
				<span>{{$t('settings.virtualKb')}}</span>
				<g-switch v-model="virtualKeyboard" @change="changeSetting"/>
			</div>
			<div class="row-flex align-items-center justify-between">
				<span>{{$t('settings.autoCashdrawer')}}</span>
				<g-switch v-model="automaticCashdrawer" @change="changeSetting"/>
			</div>
		</div>
		<div class="col-5 offset-1">
			<div class="row-flex align-items-center mb-3">
				<span class="mr-4">{{$t('settings.quickFnRows')}}</span>
				<div :class="['btn-fn-row', quickFnRows === (i-1) && 'selected']" v-for="i in 3" :key="i" @click="updateFnRows(i-1)">
					{{i-1}}
				</div>
			</div>
			<div class="row-flex align-items-center justify-center">
				<pos-time-picker :label="$t('settings.beginHour')" :value="beginHour" @input="beginHour = $event; changeSetting()">
					<template v-slot:append>
						<g-icon>access_time</g-icon>
					</template>
				</pos-time-picker>
			</div>
		</div>
	</div>
</template>

<script>
  import PosTimePicker from '../../pos-shared-components/POSInput/PosTimePicker';
	export default {
    name: 'viewGeneral',
		components: { PosTimePicker },
		injectService: [
      'SettingsStore:generalSettings',
      'SettingsStore:getGeneralSettings',
      'SettingsStore:updateSettings',
      'SettingsStore:resetLayoutFnBtn',
    ],
    computed: {
      barcode: {
        get() {
          if (this.generalSettings) {
            return this.generalSettings.barcode;
          }
        },
        set(val) {
					this.$set(this.generalSettings, 'barcode', val)
        }
      },
      favoriteArticle: {
        get() {
          if (this.generalSettings) {
            return this.generalSettings.favoriteArticle;
          }
        },
        set(val) {
					this.$set(this.generalSettings, 'favoriteArticle', val)
        }
      },
      virtualKeyboard: {
        get() {
          if (this.generalSettings) {
            return this.generalSettings.virtualKeyboard;
          }
        },
        set(val) {
					this.$set(this.generalSettings, 'virtualKeyboard', val)
				}
      },
      automaticCashdrawer: {
        get() {
          if (this.generalSettings) {
            return this.generalSettings.automaticCashdrawer;
          }
        },
        set(val) {
					this.$set(this.generalSettings, 'automaticCashdrawer', val)
				}
      },
			quickFnRows: {
      	get() {
      		if (this.generalSettings) {
      			return this.generalSettings.quickFnRows;
					}
				},
				set(val) {
					this.$set(this.generalSettings, 'quickFnRows', val)
				}
			},
			beginHour: {
      	get() {
      		return (this.generalSettings && this.generalSettings.beginHour) || '00:00'
				},
				set(val) {
      		this.$set(this.generalSettings, 'beginHour', val)
				}
			}
    },
    methods: {
      async changeSetting() {
        await this.updateSettings()
      },
			async updateFnRows(number) {
				this.quickFnRows = number;
				await this.updateSettings();
				await this.resetLayoutFnBtn('leftFunctionButtons');
			}
    },
    async created() {
      await this.getGeneralSettings();
    }
  }
</script>

<style scoped lang="scss">
	.btn-fn-row {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		background: #F0F0F0;
		border: 1px solid #C9C9C9;
		border-radius: 2px;
		font-size: 13px;
		line-height: 16px;
		color: #1D1D26;
		margin-left: 8px;

		&.selected {
			border-color: #1271FF;
		}
	}

	.btn-fn-row:first-of-type {
		margin-left: 4px;
	}

	span {
		max-width: 150px;
	}
</style>
