// ========================================================================= //
// <template> -------------------------------------------------------------- //
// ========================================================================= //

const template = /* html */ `
<div class="hvis-k-means-vis">
	<div>
		<div>
			<div v-if="typeof error === 'string'" class="hvis-card is-warning">
				<div class="hvis-card-content">
					<div class="hvis-content" style="display: flex; flex-direction: column; gap: 1rem">
						<p style="margin: auto">A cluster visualization could not be generated for this dataset</p>
					</div>
				</div>
			</div>
			<div v-else-if="isRunning && progress < 100">
				<hvis-progress :message="status" :percent="progress"></hvis-progress>
			</div>

			<div v-else>
				<hvis-notification :can-be-closed="false"
					style="display: flex; align-items: center; padding: 1rem 1rem 0">
					<div style="display: flex; flex-direction: row; align-items: center; gap: 1rem;">

						<div class="hvis-form-container" style="flex: 0 0 400px; margin-bottom: 0 !important;">
							<form
								style="display: flex; align-items: center; justify-content: space-between; max-width: 400px; margin: auto; gap: 1rem;"
								@submit.prevent="rerunKMeans">
								<div class="hvis-field" style="flex: 0 1 33.33%; text-align: left">
									<label class="hvis-label">Minimum clusters</label>

									<div class="hvis-control" style="margin: auto;">
										<input :max="maxClusters" @keydown.enter="rerunKMeans" min="1" step="1"
											type="number" v-model="minClusters" />
									</div>
								</div>

								<div class="hvis-field" style="flex: 0 1 33.33%; text-align: left">
									<label class="hvis-label">Maximum clusters</label>

									<div class="hvis-control" style="margin: auto;">
										<input :min="minClusters" @keydown.enter="rerunKMeans" max="15" step="1"
											type="number" v-model="maxClusters" />
									</div>
								</div>

								<button style="flex: 1 0 33.33%;" @click="rerunKMeans" class="is-primary">
									<img :src="redoImageURL" class="hvis-icon">
									<span>Re-run K-Means</span>
								</button>
							</form>
						</div>

						<div style="flex: 1 0 50%; text-align: left">
							Click on a cluster to learn more about its center (mean) and
							associated data points. Note that this plot is a t-SNE
							projection of the data and the learned cluster centers into
							two dimensions.
						</div>
					</div>
				</hvis-notification>

				<div class="hvis-canvas-container" ref="container"
					style="height: 100%; width: 100%; display: flex; align-items: center; justify-content: center;">
					<div class="fade-in-element"
						style="display: flex; justify-content: center; align-items: center; height: 25vh; width: 25vw; max-width:200px; max-height:200px">
						<svg class="machine" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" viewBox="0 0 645 526">
							<defs />
							<g>
								<path x="-173,694" y="-173,694" class="large-shadow"
									d="M645 194v-21l-29-4c-1-10-3-19-6-28l25-14 -8-19 -28 7c-5-8-10-16-16-24L602 68l-15-15 -23 17c-7-6-15-11-24-16l7-28 -19-8 -14 25c-9-3-18-5-28-6L482 10h-21l-4 29c-10 1-19 3-28 6l-14-25 -19 8 7 28c-8 5-16 10-24 16l-23-17L341 68l17 23c-6 7-11 15-16 24l-28-7 -8 19 25 14c-3 9-5 18-6 28l-29 4v21l29 4c1 10 3 19 6 28l-25 14 8 19 28-7c5 8 10 16 16 24l-17 23 15 15 23-17c7 6 15 11 24 16l-7 28 19 8 14-25c9 3 18 5 28 6l4 29h21l4-29c10-1 19-3 28-6l14 25 19-8 -7-28c8-5 16-10 24-16l23 17 15-15 -17-23c6-7 11-15 16-24l28 7 8-19 -25-14c3-9 5-18 6-28L645 194zM471 294c-61 0-110-49-110-110S411 74 471 74s110 49 110 110S532 294 471 294z" />
							</g>
							<g>
								<path x="-136,996" y="-136,996" class="medium-shadow"
									d="M402 400v-21l-28-4c-1-10-4-19-7-28l23-17 -11-18L352 323c-6-8-13-14-20-20l11-26 -18-11 -17 23c-9-4-18-6-28-7l-4-28h-21l-4 28c-10 1-19 4-28 7l-17-23 -18 11 11 26c-8 6-14 13-20 20l-26-11 -11 18 23 17c-4 9-6 18-7 28l-28 4v21l28 4c1 10 4 19 7 28l-23 17 11 18 26-11c6 8 13 14 20 20l-11 26 18 11 17-23c9 4 18 6 28 7l4 28h21l4-28c10-1 19-4 28-7l17 23 18-11 -11-26c8-6 14-13 20-20l26 11 11-18 -23-17c4-9 6-18 7-28L402 400zM265 463c-41 0-74-33-74-74 0-41 33-74 74-74 41 0 74 33 74 74C338 430 305 463 265 463z" />
							</g>
							<g>
								<path x="-100,136" y="-100,136" class="small-shadow"
									d="M210 246v-21l-29-4c-2-10-6-18-11-26l18-23 -15-15 -23 18c-8-5-17-9-26-11l-4-29H100l-4 29c-10 2-18 6-26 11l-23-18 -15 15 18 23c-5 8-9 17-11 26L10 225v21l29 4c2 10 6 18 11 26l-18 23 15 15 23-18c8 5 17 9 26 11l4 29h21l4-29c10-2 18-6 26-11l23 18 15-15 -18-23c5-8 9-17 11-26L210 246zM110 272c-20 0-37-17-37-37s17-37 37-37c20 0 37 17 37 37S131 272 110 272z" />
							</g>
							<g>
								<path x="-100,136" y="-100,136" class="small"
									d="M200 236v-21l-29-4c-2-10-6-18-11-26l18-23 -15-15 -23 18c-8-5-17-9-26-11l-4-29H90l-4 29c-10 2-18 6-26 11l-23-18 -15 15 18 23c-5 8-9 17-11 26L0 215v21l29 4c2 10 6 18 11 26l-18 23 15 15 23-18c8 5 17 9 26 11l4 29h21l4-29c10-2 18-6 26-11l23 18 15-15 -18-23c5-8 9-17 11-26L200 236zM100 262c-20 0-37-17-37-37s17-37 37-37c20 0 37 17 37 37S121 262 100 262z" />
							</g>
							<g>
								<path x="-173,694" y="-173,694" class="large"
									d="M635 184v-21l-29-4c-1-10-3-19-6-28l25-14 -8-19 -28 7c-5-8-10-16-16-24L592 58l-15-15 -23 17c-7-6-15-11-24-16l7-28 -19-8 -14 25c-9-3-18-5-28-6L472 0h-21l-4 29c-10 1-19 3-28 6L405 9l-19 8 7 28c-8 5-16 10-24 16l-23-17L331 58l17 23c-6 7-11 15-16 24l-28-7 -8 19 25 14c-3 9-5 18-6 28l-29 4v21l29 4c1 10 3 19 6 28l-25 14 8 19 28-7c5 8 10 16 16 24l-17 23 15 15 23-17c7 6 15 11 24 16l-7 28 19 8 14-25c9 3 18 5 28 6l4 29h21l4-29c10-1 19-3 28-6l14 25 19-8 -7-28c8-5 16-10 24-16l23 17 15-15 -17-23c6-7 11-15 16-24l28 7 8-19 -25-14c3-9 5-18 6-28L635 184zM461 284c-61 0-110-49-110-110S401 64 461 64s110 49 110 110S522 284 461 284z" />
							</g>
							<g>
								<path x="-136,996" y="-136,996" class="medium"
									d="M392 390v-21l-28-4c-1-10-4-19-7-28l23-17 -11-18L342 313c-6-8-13-14-20-20l11-26 -18-11 -17 23c-9-4-18-6-28-7l-4-28h-21l-4 28c-10 1-19 4-28 7l-17-23 -18 11 11 26c-8 6-14 13-20 20l-26-11 -11 18 23 17c-4 9-6 18-7 28l-28 4v21l28 4c1 10 4 19 7 28l-23 17 11 18 26-11c6 8 13 14 20 20l-11 26 18 11 17-23c9 4 18 6 28 7l4 28h21l4-28c10-1 19-4 28-7l17 23 18-11 -11-26c8-6 14-13 20-20l26 11 11-18 -23-17c4-9 6-18 7-28L392 390zM255 453c-41 0-74-33-74-74 0-41 33-74 74-74 41 0 74 33 74 74C328 420 295 453 255 453z" />
							</g>
						</svg>
					</div>
				</div>
			</div>
		</div>
	</div>

	<hvis-notification :is-active="tableIsVisible" @close="tableIsVisible = false">
		<div>
			<div v-if="!selectedCentroidData">
				No clusters have been selected yet.
			</div>

			<div v-else>
				<div class="
							hvis-row
							hvis-row-with-space-between
							hvis-row-centered-vertically
							hvis-row-with-no-wrapping
						">
					<h3 class="hvis-title">
						<div :style="'background-color: ' + selectedCentroidData.color" class="hvis-dot">
						</div>

						<div>
							{{ selectedCentroidData.title }}
						</div>

						<div class="hvis-control-buttons">
							<button @click="startRename" alt="Rename" class="is-clear is-rounded">
								<img :src="editImageURL" class="hvis-icon">
							</button>

							<button @click="downloadSelectedCentroidData" alt="Download" class="is-clear is-rounded">
								<img :src="downloadImageURL" class="hvis-icon">
							</button>
						</div>
					</h3>
				</div>

				<hvis-modal-with-prompt :is-active="renameModalIsVisible" @cancel="cancelRename"
					@confirm="confirmRename" title="Rename">
					<p>Rename cluster "{{ selectedCentroidData.title }}" to:</p>

					<div>
						<form @submit.prevent="confirmRename">
							<input ref="renameInput" type="text" v-model="newTitle" />

							<input style="display: none" type="submit" value="Rename">
						</form>
					</div>
				</hvis-modal-with-prompt>

				<div style="overflow: scroll; font-size: 0.65em; max-height: 67vh;">
					<table class="hvis-table">
						<thead>
							<tr>
								<th :key="column" v-for="
											column in ['']
												.concat(this.numbersOnlyCoreData.columns)
												.map(c => 
													truncate(c, 32, store.settings.truncationMode)
												)
										">
									{{ column }}
								</th>
							</tr>
						</thead>

						<tbody>
							<tr class="hvis-special">
								<td>cluster center</td>

								<td :key="j" v-for="j in range(0, selectedCentroidData.centroid.length)">
									{{ selectedCentroidData.centroid[j] }}
								</td>
							</tr>

							<tr :key="i" v-for="i in range(0, selectedCentroidData.points.length)">
								<td>
									row{{
									leftPad(
									selectedCentroidData.pointsIndices[i],
									this.coreData.shape[0].toString().length
									)
									}}
								</td>

								<td :key="j" v-for="
											j in range(0, selectedCentroidData.points[i].length)
										">
									{{ selectedCentroidData.points[i][j] }}
								</td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>
		</div>
	</hvis-notification>
</div>
`

export { template }
