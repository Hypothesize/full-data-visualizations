// ========================================================================= //
// <template> -------------------------------------------------------------- //
// ========================================================================= //

const template = /* html */ `
	<div class="hvis-k-means-vis">
		<div>
			<div>
				<div v-if="typeof error === 'string'" class="hvis-card is-warning" style="margin-bottom: 2rem">
					<div class="hvis-card-content">
						<div class="hvis-content" style="display: flex; flex-direction: column; gap: 1rem"> 
							<p style="margin: auto">{{ error }}</p>
						</div>
					</div>
				</div>
				<div v-else-if="isRunning && progress < 100">
					<hvis-progress :message="status" :percent="progress"></hvis-progress>
				</div>

				<div v-else>
					<div class="hvis-top-row">
						<div>
							<hvis-notification :can-be-closed="false">
								<div class="hvis-form-container">
									<form @submit.prevent="rerunKMeans">
										<div class="hvis-field">
											<label class="hvis-label">Minimum clusters</label>

											<div class="hvis-control">
												<input
													:max="maxClusters"
													@keydown.enter="rerunKMeans"
													min="1"
													step="1"
													type="number"
													v-model="minClusters" />
											</div>
										</div>

										<div class="hvis-field">
											<label class="hvis-label">Maximum clusters</label>

											<div class="hvis-control">
												<input
													:min="minClusters"
													@keydown.enter="rerunKMeans"
													max="15"
													step="1"
													type="number"
													v-model="maxClusters" />
											</div>
										</div>

										<div>
											<button
												@click="rerunKMeans"
												class="is-primary">
												<img
													:src="redoImageURL"
													class="hvis-icon">
												<span>Re-run K-Means</span>
											</button>
										</div>
									</form>
								</div>

								<div>
									Click on a cluster to learn more about its center (mean) and
									associated data points. Note that this plot is a t-SNE
									projection of the data and the learned cluster centers into
									two dimensions.
								</div>
							</hvis-notification>
						</div>

						<div>
							<p class="hvis-canvas-container" ref="container"></p>
						</div>
					</div>
				</div>
			</div>
		</div>

		<hvis-notification
			:is-active="tableIsVisible"
			@close="tableIsVisible = false"
			type="info">
			<div>
				<div v-if="!selectedCentroidData">
					No clusters have been selected yet.
				</div>

				<div v-else>
					<div 
						class="
							hvis-row
							hvis-row-with-space-between
							hvis-row-centered-vertically
							hvis-row-with-no-wrapping
						">
						<h3 class="hvis-title">
							<div
								:style="'background-color: ' + selectedCentroidData.color"
								class="hvis-dot">
							</div>

							<div>
								{{ selectedCentroidData.title }}
							</div>

							<div class="hvis-control-buttons">
								<button
									@click="startRename"
									alt="Rename"
									class="is-clear is-rounded">
									<img
										:src="editImageURL"
										class="hvis-icon">
								</button>

								<button
									@click="downloadSelectedCentroidData"
									alt="Download"
									class="is-clear is-rounded">
									<img
										:src="downloadImageURL"
										class="hvis-icon">
								</button>
							</div>
						</h3>
					</div>

					<hvis-modal-with-prompt
						:is-active="renameModalIsVisible"
						@cancel="cancelRename"
						@confirm="confirmRename"
						title="Rename">
						<p>Rename cluster "{{ selectedCentroidData.title }}" to:</p>

						<div>
							<form @submit.prevent="confirmRename">
								<input
									ref="renameInput"
									type="text"
									v-model="newTitle" />

								<input style="display: none" type="submit" value="Rename">
							</form>
						</div>
					</hvis-modal-with-prompt>

					<div style="overflow: scroll; font-size: 0.65em; max-height: 67vh;">
						<table class="hvis-table">
							<thead>
								<tr>
									<th
										:key="column"
										v-for="
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

									<td
										:key="j"
										class="hvis-special"
										v-for="j in range(0, selectedCentroidData.centroid.length)">
										{{ selectedCentroidData.centroid[j] }}
									</td>
								</tr>

								<tr
									:key="i" 
									v-for="i in range(0, selectedCentroidData.points.length)">
									<td>
										row{{ 
											leftPad(
												selectedCentroidData.pointsIndices[i],
												this.coreData.shape[0].toString().length
											)
										}}
									</td>

									<td
										:key="j"
										v-for="
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
