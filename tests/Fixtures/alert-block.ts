import { defineBlock, registerBlock } from "@javaabu/block-editor"

// The JS half of the Alert test block (tests/Fixtures/Blocks/Alert.php).
registerBlock(defineBlock({ name: "alert" }))
