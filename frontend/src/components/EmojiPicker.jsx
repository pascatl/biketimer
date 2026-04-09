import React, { useState } from "react";
import {
	Box,
	IconButton,
	InputBase,
	Popover,
	Tab,
	Tabs,
	Tooltip,
	Typography,
} from "@mui/material";
import AddReactionIcon from "@mui/icons-material/AddReaction";
import SearchIcon from "@mui/icons-material/Search";

const EMOJI_CATEGORIES = [
	{
		label: "😊",
		title: "Smileys",
		emojis: [
			"😀","😃","😄","😁","😆","😅","🤣","😂","🙂","🙃","😉","😊","😇","🥰","😍","🤩","😘","😗","😚","😙",
			"🥲","😋","😛","😜","🤪","😝","🤑","🤗","🤭","🤫","🤔","🤐","🤨","😐","😑","😶","😏","😒","🙄","😬",
			"🤥","😌","😔","😪","🤤","😴","😷","🤒","🤕","🤢","🤮","🤧","🥵","🥶","🥴","😵","🤯","🤠","🥳","🥸",
			"😎","🤓","🧐","😕","😟","🙁","☹️","😮","😯","😲","😳","🥺","😦","😧","😨","😰","😥","😢","😭","😱",
			"😖","😣","😞","😓","😩","😫","🥱","😤","😡","😠","🤬","😈","👿","💀","☠️","💩","🤡","👹","👺","👻",
			"👽","👾","🤖","😺","😸","😹","😻","😼","😽","🙀","😿","😾",
		],
	},
	{
		label: "👍",
		title: "Gesten",
		emojis: [
			"👋","🤚","🖐️","✋","🖖","👌","🤌","🤏","✌️","🤞","🤟","🤘","🤙","👈","👉","👆","🖕","👇","☝️","👍",
			"👎","✊","👊","🤛","🤜","👏","🙌","👐","🤲","🤝","🙏","✍️","💅","🤳","💪","🦾","🦿","🦵","🦶","👂",
			"🦻","👃","🫀","🫁","🧠","🦷","🦴","👀","👁️","👅","👄","🫦",
		],
	},
	{
		label: "❤️",
		title: "Herzen",
		emojis: [
			"❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","❤️‍🔥","❤️‍🩹","💔","❣️","💕","💞","💓","💗","💖","💘","💝",
			"💟","☮️","✝️","☯️","🕉️","☦️","🛐","⛎","♈","♉","♊","♋","♌","♍","♎","♏","♐","♑","♒","♓",
		],
	},
	{
		label: "🎉",
		title: "Feiern",
		emojis: [
			"🎉","🎊","🎈","🎁","🎀","🎗️","🎟️","🎫","🏆","🥇","🥈","🥉","🏅","🎖️","🏵️","🎗️","🎭","🎨","🎬","🎤",
			"🎧","🎼","🎵","🎶","🎷","🎸","🎹","🎺","🎻","🪕","🥁","🪘","🎙️","📻","🎚️","🎛️","📺","📷","📸","🎮",
		],
	},
	{
		label: "🐶",
		title: "Tiere",
		emojis: [
			"🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐻‍❄️","🐨","🐯","🦁","🐮","🐷","🐸","🐵","🙈","🙉","🙊","🐔",
			"🐧","🐦","🐤","🦆","🦅","🦉","🦇","🐺","🐗","🐴","🦄","🐝","🐛","🦋","🐌","🐞","🐜","🦟","🦗","🪲",
			"🐢","🐍","🦎","🦖","🦕","🐙","🦑","🦐","🦞","🦀","🐡","🐠","🐟","🐬","🐳","🐋","🦈","🐊","🐅","🐆",
			"🦓","🦍","🦧","🦣","🐘","🦛","🦏","🐪","🐫","🦒","🦘","🦬","🐃","🐂","🐄","🐎","🐖","🐏","🐑","🦙",
			"🐐","🦌","🐕","🐩","🦮","🐕‍🦺","🐈","🐈‍⬛","🪶","🐓","🦃","🦤","🦚","🦜","🦢","🦩","🕊️","🐇","🦝","🦨",
		],
	},
	{
		label: "🍎",
		title: "Essen",
		emojis: [
			"🍎","🍊","🍋","🍇","🍓","🍈","🍒","🍑","🥭","🍍","🥥","🥝","🍅","🍆","🥑","🥦","🥬","🥒","🌶️","🫑",
			"🌽","🥕","🧄","🧅","🥔","🍠","🥐","🥯","🍞","🥖","🥨","🧀","🥚","🍳","🧈","🥞","🧇","🥓","🥩","🍗",
			"🍖","🦴","🌭","🍔","🍟","🍕","🫓","🥪","🥙","🧆","🌮","🌯","🫔","🥗","🥘","🫕","🥫","🍝","🍜","🍲",
			"🍛","🍣","🍱","🥟","🦪","🍤","🍙","🍚","🍘","🍥","🥮","🍢","🧁","🍰","🎂","🍮","🍭","🍬","🍫","🍿",
			"🍩","🍪","🌰","🥜","🍯","🧃","🥤","🧋","☕","🍵","🍶","🍺","🍻","🥂","🍷","🥃","🍸","🍹","🧉","🍾",
		],
	},
	{
		label: "⚽",
		title: "Sport",
		emojis: [
			"⚽","🏀","🏈","⚾","🥎","🎾","🏐","🏉","🥏","🎱","🪀","🏓","🏸","🏒","🏑","🥍","🏏","🪃","🥅","⛳",
			"🪁","🏹","🎣","🤿","🥊","🥋","🎽","🛹","🛼","🛷","⛸️","🥌","🎿","⛷️","🏂","🪂","🏋️","🤼","🤸","⛹️",
			"🤺","🏇","🧘","🏄","🏊","🚴","🧗","🚵","🏌️","🏄","🤽","🚣","🧜","🧗","🏋️","🤸","🤺","🥇",
		],
	},
	{
		label: "🚗",
		title: "Reisen",
		emojis: [
			"🚗","🚕","🚙","🚌","🚎","🏎️","🚓","🚑","🚒","🚐","🛻","🚚","🚛","🚜","🏍️","🛵","🛺","🚲","🛴","🛹",
			"🛼","🚏","🛣️","🛤️","⛽","🚨","🚥","🚦","🛑","🚧","⚓","⛵","🛶","🚤","🛳️","⛴️","🛥️","🚢","✈️","🛩️",
			"🛫","🛬","🪂","💺","🚁","🚟","🚠","🚡","🛰️","🚀","🛸","🪐","🌍","🌎","🌏","🗺️","🧭","⛰️","🏔️","🗻",
		],
	},
	{
		label: "💡",
		title: "Objekte",
		emojis: [
			"💡","🔦","🕯️","🪔","🧯","🛢️","💰","💳","💎","⚖️","🪜","🧲","🔧","🪛","🔩","⚙️","🗜️","⚒️","🛠️","⛏️",
			"🪚","🔨","🪓","🗡️","⚔️","🛡️","🔫","🪃","🏹","🪤","🪣","🔪","🗃️","🗄️","🗑️","🔐","🔒","🔓","🔏","🔑",
			"🗝️","🔨","🪄","🧸","🪆","🖼️","🧵","🪡","🧶","👓","🕶️","🥽","🌂","☂️","🧵","🪡","🧶","🪢","👑","💒",
		],
	},
	{
		label: "🌈",
		title: "Symbole",
		emojis: [
			"🌈","☀️","🌤️","⛅","🌥️","☁️","🌦️","🌧️","⛈️","🌩️","🌨️","❄️","☃️","⛄","🌬️","💨","🌪️","🌫️","🌊","🌀",
			"🌁","🌂","☔","⛱️","⚡","🌟","💫","✨","🔥","💥","❗","❕","❓","❔","‼️","⁉️","🚫","⛔","📛","🔞",
			"🔃","🔄","🔙","🔚","🔛","🔜","🔝","✅","☑️","❎","🟥","🟧","🟨","🟩","🟦","🟪","🟫","⬛","⬜","🔶",
			"🔷","🔸","🔹","🔺","🔻","💠","🔘","🔲","🔳","▪️","▫️","◾","◽","◼️","◻️","🔴","🟠","🟡","🟢","🔵",
		],
	},
];

export default function EmojiPicker({ onSelect, size = "small" }) {
	const [anchorEl, setAnchorEl] = useState(null);
	const [tabIndex, setTabIndex] = useState(0);
	const [search, setSearch] = useState("");
	const open = Boolean(anchorEl);

	const handleOpen = (e) => {
		e.stopPropagation();
		setAnchorEl(e.currentTarget);
	};

	const handleClose = () => {
		setAnchorEl(null);
		setSearch("");
		setTabIndex(0);
	};

	const handleSelect = (emoji) => {
		onSelect(emoji);
		handleClose();
	};

	const searchLower = search.toLowerCase();
	const filteredEmojis = search
		? EMOJI_CATEGORIES.flatMap((cat) =>
				cat.emojis.filter((e) => e.includes(searchLower) || cat.title.toLowerCase().includes(searchLower))
		  )
		: EMOJI_CATEGORIES[tabIndex]?.emojis || [];

	return (
		<>
			<Tooltip title="Reagieren">
				<IconButton
					size={size}
					onClick={handleOpen}
					sx={{
						p: 0.25,
						color: "text.disabled",
						"&:hover": { color: "primary.main", bgcolor: "transparent" },
					}}
				>
					<AddReactionIcon sx={{ fontSize: size === "small" ? "1rem" : "1.2rem" }} />
				</IconButton>
			</Tooltip>

			<Popover
				open={open}
				anchorEl={anchorEl}
				onClose={handleClose}
				anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
				transformOrigin={{ vertical: "top", horizontal: "left" }}
				PaperProps={{
					sx: {
						borderRadius: 3,
						boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
						width: 320,
						maxHeight: 380,
						display: "flex",
						flexDirection: "column",
						overflow: "hidden",
					},
				}}
			>
				{/* Search bar */}
				<Box sx={{ px: 1.5, pt: 1.25, pb: 0.5, borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
					<Box sx={{ display: "flex", alignItems: "center", gap: 0.75, bgcolor: "rgba(0,0,0,0.04)", borderRadius: 2, px: 1, py: 0.5 }}>
						<SearchIcon sx={{ fontSize: "0.9rem", color: "text.disabled" }} />
						<InputBase
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							placeholder="Emoji suchen…"
							sx={{ fontSize: "0.82rem", flex: 1 }}
							autoFocus
						/>
					</Box>
				</Box>

				{/* Category tabs */}
				{!search && (
					<Tabs
						value={tabIndex}
						onChange={(_, v) => setTabIndex(v)}
						variant="scrollable"
						scrollButtons={false}
						sx={{
							minHeight: 36,
							borderBottom: "1px solid rgba(0,0,0,0.07)",
							"& .MuiTab-root": { minWidth: 30, minHeight: 36, px: 0.75, py: 0, fontSize: "1rem" },
						}}
					>
						{EMOJI_CATEGORIES.map((cat, i) => (
							<Tab key={i} label={cat.label} />
						))}
					</Tabs>
				)}

				{/* Emoji grid */}
				<Box
					sx={{
						flex: 1,
						overflowY: "auto",
						p: 1,
						display: "flex",
						flexWrap: "wrap",
						gap: 0.25,
						alignContent: "flex-start",
					}}
				>
					{filteredEmojis.length === 0 ? (
						<Typography variant="caption" sx={{ color: "text.disabled", p: 1 }}>
							Keine Emojis gefunden
						</Typography>
					) : (
						filteredEmojis.map((emoji, i) => (
							<Box
								key={i}
								onClick={() => handleSelect(emoji)}
								sx={{
									width: 36,
									height: 36,
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									fontSize: "1.35rem",
									borderRadius: 1.5,
									cursor: "pointer",
									transition: "background 0.1s",
									"&:hover": { bgcolor: "rgba(45,60,89,0.1)", transform: "scale(1.2)" },
								}}
							>
								{emoji}
							</Box>
						))
					)}
				</Box>
			</Popover>
		</>
	);
}
