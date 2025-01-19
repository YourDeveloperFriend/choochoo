export function SwedenRules() {
    return <div>
        <p>Same as base game with the following changes:</p>
        <ul>
            <li><b>Urbanization</b>: only 4 black cities are available.</li>
            <li><b>Goods growth is skipped:</b> Instead, at the end of the move phase, all delivered goods are "recycled".</li>
            <li><b>Recycling:</b> Yellow cubes -&gt; red -&gt; blue -&gt; black. After they're recycled they stay in their destination city.</li>
            <li><b>Goods Growth box:</b> We use the goods growth box to indicate what goods will be recycled.</li>
            <li><b>Black cubes:</b> once delivered, are removed from the board and can later be claimed.</li>
            <li><b>WTE Plant Operator action:</b> claims the black cubes in the WTE Plant. Each cube is worth 2 points.</li>
        </ul>
    </div>;
}
