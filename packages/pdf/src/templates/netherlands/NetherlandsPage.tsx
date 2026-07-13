import type { Style } from "@react-pdf/types";
import type { TemplatePageProps } from "../../document";
import type {
	TemplateColorRoles,
	TemplateFeatureStyleSlots,
	TemplateFeatures,
	TemplateStyleContext,
	TemplateStyleSlots,
} from "../shared/types";
import React, { Fragment, useMemo } from "react";
import { rgbaStringToHex } from "@reactive-resume/utils/color";
import { Image, Page, StyleSheet, View } from "#react-pdf-renderer";
import { useRender } from "../../context";
import { createBaseTemplateStyles } from "../shared/base-template-styles";
import {
	CustomFieldContactItem,
	EmailContactItem,
	LocationContactItem,
	PhoneContactItem,
	WebsiteContactItem,
} from "../shared/contact-item";
import { TemplateProvider } from "../shared/context";
import { shouldShowResumeHeader } from "../shared/cover-letter";
import { filterSections } from "../shared/filtering";
import { getTemplateMetrics } from "../shared/metrics";
import { getTemplatePageMinHeightStyle, getTemplatePageSize } from "../shared/page-size";
import { hasTemplatePicture } from "../shared/picture";
import { Heading, Text } from "../shared/primitives";
import { createRtlStyleHelpers } from "../shared/rtl";
import { Section } from "../shared/sections";
import { composeStyles, headerNameLineHeight, resolvePlacementColor } from "../shared/styles";

type NetherlandsStyles = Omit<TemplateStyleSlots, "page"> & {
	page: Style;
	sidebarColumn: Style;
	mainColumn: Style;
	header: Style;
	picture: Style;
	headerTitle: Style;
	headerIdentity: Style;
	headerName: Style;
	headerHeadline: Style;
	headerContactList: Style;
	headerContactItem: Style;
	headerContactTextStyle: Style;
	headerContactDivider: Style;
	sidebarDivider: Style;
};

type NetherlandsTemplate = {
	colors: TemplateColorRoles;
	styles: NetherlandsStyles;
	featureStyles: TemplateFeatureStyleSlots;
};

type NetherlandsHeaderProps = {
	styles: NetherlandsStyles;
};

const netherlandsFeatures = {
	sectionTimeline: true,
} satisfies TemplateFeatures;

export const NetherlandsPage = ({ page, pageIndex }: TemplatePageProps) => {
	const data = useRender();
	const { metadata, picture } = data;
	const { colors, styles, featureStyles } = useNetherlandsTemplate();
	const metrics = getTemplateMetrics(metadata.page);
	const pageSize = getTemplatePageSize(metadata.page.format);
	const pageMinHeightStyle = getTemplatePageMinHeightStyle(metadata.page.format);
	const hasPicture = hasTemplatePicture(picture);
	const showHeader = shouldShowResumeHeader(data, pageIndex);
	const sidebarSections = filterSections(page.sidebar, data);
	const mainSections = filterSections(page.main, data);

	return (
		<Page size={pageSize} style={composeStyles(styles.page, pageMinHeightStyle)}>
			<TemplateProvider styles={styles} featureStyles={featureStyles} colors={colors} features={netherlandsFeatures}>
				<View
					style={composeStyles(styles.sidebarColumn, {
						display: page.fullWidth ? "none" : "flex",
						flexBasis: `${metadata.layout.sidebarWidth}%`,
						paddingTop: metrics.page.paddingVertical,
						paddingRight: metrics.columnGap,
						paddingBottom: metrics.page.paddingVertical,
						paddingLeft: metrics.page.paddingHorizontal,
						rowGap: metrics.sectionGap,
					})}
				>
					{showHeader && hasPicture && <Image src={picture.url} style={styles.picture} />}

					{sidebarSections.map((section, index) => (
						<Fragment key={section}>
							{index > 0 && <View style={styles.sidebarDivider} />}
							<Section section={section} placement="sidebar" />
						</Fragment>
					))}
				</View>

				<View
					style={composeStyles(styles.mainColumn, {
						paddingTop: metrics.page.paddingVertical,
						paddingRight: metrics.page.paddingHorizontal,
						paddingBottom: metrics.page.paddingVertical,
						paddingLeft: page.fullWidth ? metrics.page.paddingHorizontal : metrics.columnGap,
						rowGap: metrics.sectionGap,
					})}
				>
					{showHeader && <Header styles={styles} />}

					{mainSections.map((section) => (
						<Section key={section} section={section} placement="main" />
					))}
				</View>
			</TemplateProvider>
		</Page>
	);
};

const Header = ({ styles }: NetherlandsHeaderProps) => {
	const { basics } = useRender();

	// Build contact items, filtering out empty ones so dividers only appear between items
	const contactItems: React.ReactNode[] = [];
	if (basics.location) {
		contactItems.push(<LocationContactItem key="location" location={basics.location} style={styles.headerContactItem} textStyle={styles.headerContactTextStyle} />);
	}
	if (basics.phone) {
		contactItems.push(<PhoneContactItem key="phone" phone={basics.phone} style={styles.headerContactItem} textStyle={styles.headerContactTextStyle} />);
	}
	if (basics.email) {
		contactItems.push(<EmailContactItem key="email" email={basics.email} style={styles.headerContactItem} textStyle={styles.headerContactTextStyle} />);
	}
	if (basics.website.url) {
		contactItems.push(<WebsiteContactItem key="website" website={basics.website} style={styles.headerContactItem} textStyle={styles.headerContactTextStyle} />);
	}
	for (const field of basics.customFields) {
		contactItems.push(<CustomFieldContactItem key={field.id} field={field} style={styles.headerContactItem} textStyle={styles.headerContactTextStyle} />);
	}

	return (
		<View style={styles.header}>
			<View style={styles.headerTitle}>
				<View style={styles.headerIdentity}>
					<Heading style={styles.headerName}>{basics.name}</Heading>
					<Text style={styles.headerHeadline}>{basics.headline}</Text>
				</View>
			</View>

			<View style={styles.headerContactList}>
				{contactItems.map((item, index) => (
					<Fragment key={index}>
						{index > 0 && <View style={styles.headerContactDivider} />}
						{item}
					</Fragment>
				))}
			</View>
		</View>
	);
};


const useNetherlandsTemplate = (): NetherlandsTemplate => {
	const { picture, metadata, rtl } = useRender();

	return useMemo(() => {
		const r = createRtlStyleHelpers(rtl);
		const foreground = rgbaStringToHex(metadata.design.colors.text);
		const background = rgbaStringToHex(metadata.design.colors.background);
		const primary = rgbaStringToHex(metadata.design.colors.primary);

		// Sidebar colors: the sidebar background IS the primary color,
		// and sidebar text is white/background color.
		const sidebarBg = primary;
		const sidebarFg = background;
		// Unified secondary color for headline, contacts, descriptions, dates, timeline
		const secondaryColor = rgbaStringToHex("rgba(80, 80, 80, 1)");

		const colors: TemplateColorRoles = {
			foreground,
			background,
			primary,
			sidebarForeground: sidebarFg,
			sidebarBackground: sidebarBg,
		};

		const metrics = getTemplateMetrics(metadata.page);

		const base = createBaseTemplateStyles({ metadata, foreground, r, metrics, picture });

		const baseStyles = StyleSheet.create({
			...base,
			// Increase gap between section item header and description
			div: {
				...base.div,
				rowGap: metrics.gapY(0.3),
			},
			page: {
				flexDirection: r.row,
				color: foreground,
				backgroundColor: background,
				fontFamily: metadata.typography.body.fontFamily,
				fontSize: metadata.typography.body.fontSize,
				lineHeight: metadata.typography.body.lineHeight,
				direction: r.pageDirection,
			},
			// Main column section headings: uppercase, underlined, dark text
			sectionHeading: {
				fontSize: metadata.typography.heading.fontSize * 0.75,
				textTransform: "uppercase",
				letterSpacing: 1,
				borderBottomWidth: 1,
				borderBottomColor: foreground,
				paddingBottom: metrics.gapY(0.2),
				marginBottom: metrics.gapY(0.4),
			},
			sidebarColumn: {
				backgroundColor: sidebarBg,
			},
			mainColumn: {
				flex: 1,
			},
			picture: {
				width: picture.size,
				height: picture.size,
				borderRadius: picture.borderRadius,
				objectFit: "cover",
				alignSelf: "center",
				marginBottom: metrics.gapY(0.25),
			},
			header: {
				flexDirection: r.row,
				justifyContent: "space-between",
				alignItems: "flex-start",
				marginBottom: metrics.gapY(0.25),
			},
			headerTitle: {
				flexGrow: 1,
				flexShrink: 0,
				rowGap: metrics.gapY(0.2),
			},
			headerIdentity: {
				...r.headerIdentity,
				rowGap: metrics.gapY(0.25),
			},
			headerName: {
				fontSize: metadata.typography.heading.fontSize * 1.8,
				lineHeight: headerNameLineHeight,
				fontWeight: 700,
			},
			headerHeadline: {
				fontSize: metadata.typography.body.fontSize * 0.95,
				textTransform: "uppercase",
				letterSpacing: 1.5,
				color: secondaryColor,
			},
			// Contact details stacked vertically on the right, self-contained block
			headerContactList: {
				flexDirection: "column",
				alignItems: "stretch",
				alignSelf: "flex-start",
				paddingTop: metrics.gapY(0.25),
				flexShrink: 0,
			},
			headerContactItem: {
				flexDirection: r.row,
				alignItems: "center",
				columnGap: metrics.gapX(0.3),
				color: secondaryColor,
				paddingVertical: metrics.gapY(0.2),
				flexWrap: "wrap",
			},
			// Explicit text style for contact items — overrides the Text primitive's
			// built-in body fontSize so contactFontSize actually takes effect
			headerContactTextStyle: {
				fontSize: metadata.page.contactFontSize ?? metadata.typography.body.fontSize * 0.8,
				color: secondaryColor,
			},
			headerContactDivider: {
				alignSelf: "stretch",
				height: 0.5,
				backgroundColor: rgbaStringToHex("rgba(180, 180, 180, 0.7)"),
			},
			// Horizontal divider between sidebar sections
			sidebarDivider: {
				width: "100%",
				height: 0.75,
				backgroundColor: sidebarFg,
				opacity: 0.3,
			},
		});



		const sectionTimelineStyles = StyleSheet.create({
			items: {
				position: "relative",
			},
			line: {
				position: "absolute",
				top: 0,
				bottom: 0,
				left: 7.5,
				width: 1.5,
				backgroundColor: secondaryColor,
			},
			item: {
				flexDirection: "row",
				columnGap: metrics.gapX(1 / 2),
				position: "relative",
			},
			marker: {
				width: 16,
				alignItems: "center",
			},
			dot: {
				width: 10,
				height: 10,
				marginTop: 8,
				borderRadius: 999,
				backgroundColor: secondaryColor,
			},
			content: {
				flex: 1,
				minWidth: 0,
			},
		});

		const foregroundFor = ({ placement, colors }: TemplateStyleContext) =>
			resolvePlacementColor({
				placement,
				defaultForeground: colors.foreground,
				sidebarForeground: colors.sidebarForeground,
			});

		const accentFor = ({ placement, colors }: TemplateStyleContext) =>
			resolvePlacementColor({
				placement,
				defaultForeground: colors.primary,
				sidebarForeground: colors.sidebarForeground,
			});

		const featureStyles = {
			sectionTimeline: {
				...sectionTimelineStyles,
			},
		};

		return {
			colors,
			styles: {
				...baseStyles,
				text: (context) => ({ ...baseStyles.text, color: foregroundFor(context) }),
				heading: (context) => ({ ...baseStyles.heading, color: foregroundFor(context) }),
				link: (context) => ({ ...baseStyles.link, color: foregroundFor(context) }),
				richParagraph: (context) => ({
					...baseStyles.richParagraph,
					color: context.placement === "sidebar" ? foregroundFor(context) : secondaryColor,
					fontSize: context.placement === "sidebar" ? undefined : metadata.typography.body.fontSize - 1,
				}),
				richListItemMarker: (context) => ({
					...baseStyles.richListItemMarker,
					color: context.placement === "sidebar" ? foregroundFor(context) : secondaryColor,
					fontSize: context.placement === "sidebar" ? undefined : metadata.typography.body.fontSize - 1,
				}),
				richListItemContent: (context) => ({
					...baseStyles.richListItemContent,
					color: context.placement === "sidebar" ? foregroundFor(context) : secondaryColor,
					fontSize: context.placement === "sidebar" ? undefined : metadata.typography.body.fontSize - 1,
				}),
				// Secondary labels (dates, etc.) use the same secondaryColor
				small: (context) => ({
					...baseStyles.small,
					color: context.placement === "sidebar" ? foregroundFor(context) : secondaryColor,
				}),
				splitRow: (context) => ({
					...baseStyles.splitRow,
					...(context.placement === "sidebar"
						? { flexDirection: "column", alignItems: "flex-start", justifyContent: "flex-start" }
						: {}),
				}),
				alignEnd: (context) => ({
					...baseStyles.alignEnd,
					color: context.placement === "sidebar" ? foregroundFor(context) : secondaryColor,
					...(context.placement === "sidebar" ? { textAlign: "left" } : {}),
				}),
				// Sidebar section headings: uppercase, bold, white, with underline
				sectionHeading: (context) => ({
					...baseStyles.sectionHeading,
					color: foregroundFor(context),
					borderBottomColor: foregroundFor(context),
				}),
				levelItem: (context) => ({ borderColor: foregroundFor(context) }),
				levelItemActive: (context) => ({ backgroundColor: foregroundFor(context) }),
				icon: (context) => ({
					display: metadata.page.hideIcons ? "none" : "flex",
					size: metadata.typography.body.fontSize,
					color: foregroundFor(context),
				}),
			} satisfies NetherlandsStyles,
			featureStyles,
		};
	}, [picture, metadata, rtl]);
};
