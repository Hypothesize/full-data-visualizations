// ========================================================================= //
// <style> ----------------------------------------------------------------- //
// ========================================================================= //

const css = /* css */ `
	.hvis-k-means-vis .hvis-field {
		margin-bottom: var(--padding);
	}

	.hvis-k-means-vis .hvis-field .hvis-label {
		display: block;
		margin-bottom: calc(var(--padding) / 4);
		font-weight: bold;
	}

	.hvis-k-means-vis .hvis-form-container {
		margin-bottom: var(--padding) !important;
	}

	.hvis-k-means-vis table.hvis-table thead tr th {
		vertical-align: bottom;
		font-weight: bold !important;
	}

	.hvis-k-means-vis table.hvis-table thead tr th,
	.hvis-k-means-vis table.hvis-table tbody tr td {
		text-align: center !important;
		font-family: var(--font-family-code);
		font-weight: var(--font-weight-code);
		font-size: var(--font-size-7);
		padding: calc(var(--line-thickness) * 2);
	}

	.hvis-k-means-vis table.hvis-table tbody tr td:first-child {
		font-weight: bold !important;
	}

	.hvis-k-means-vis tr.hvis-special {
		background-color: hsla(141, 71%, 48%, 0.1);
	}

	.hvis-k-means-vis td.hvis-special {
		font-weight: bold;
	}

	.hvis-k-means-vis .hvis-dot {
		width: 1em;
		height: 1em;
		max-width: 1em;
		max-height: 1em;
		border-radius: 100%;
		display: inline-block;
		margin: 0;
	}

	.hvis-k-means-vis .hvis-top-row {
		display: flex;
		flex-direction: row;
		flex-wrap: nowrap;
		justify-content: flex-start;
		align-content: flex-start;
		align-items: flex-start;
		gap: var(--padding);
	}

	.hvis-k-means-vis .hvis-top-row > * {
		width: 50%;
	}

	.hvis-k-means-vis .hvis-content .hvis-row {
		margin-bottom: 0;
	}

	.hvis-k-means-vis .hvis-row-with-space-between {
		justify-content: space-between;
	}
	
	.hvis-k-means-vis .hvis-row-centered-vertically {
		align-content: center;
		align-items: center;
		margin-bottom: var(--padding);
	}

	.hvis-k-means-vis .hvis-row-with-no-wrapping {
		flex-wrap: nowrap;
	}

	.hvis-k-means-vis h3.hvis-title {
		margin: 0 !important;
		display: flex;
		flex-direction: row;
		flex-wrap: nowrap;
		justify-content: flex-start;
		align-content: center;
		align-items: center;
		gap: calc(var(--padding) / 2);
	}

	.hvis-k-means-vis h3.hvis-title,
	.hvis-k-means-vis h3.hvis-title * {
		font-weight: var(--font-weight-title);
	}

	.hvis-k-means-vis h3.hvis-title .hvis-control-buttons button {
		position: relative;
		top: -0.0625em;
	}

	.hvis-k-means-vis .hvis-canvas-container high-dpi-canvas {
		width: 100%;
		min-width: 100%;
		max-width: 100%;
		border-radius: var(--border-radius);
		overflow: hidden;
	}
`

export { css }
