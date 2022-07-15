import { CommandInteraction, GuildMember } from 'discord.js';
import { Discord, Slash, SlashGroup, SlashOption } from 'discordx';
import { logger } from '../common/logger.js';

@Discord()
@SlashGroup({
    name: 'tag',
    description: 'User tags'
})
export class TagCommands {
    @Slash('clear', {
        description: 'Clear your user tag'
    })
    @SlashGroup('tag')
    async clearTag(
        @SlashOption('member', { type: 'USER', description: 'Who\'s tag to clear', required: false }) selectedMember: GuildMember | undefined,
        interaction: CommandInteraction
    ) {
        // If the guild everyone role is missing then fetch it
        if (!interaction.guild?.roles.everyone) await interaction.guild?.roles.fetch();

        // If they selected a user and it's not themselves then check they have permission to clear nicknames
        if (selectedMember && selectedMember.id !== interaction.member?.user.id && !(interaction.member as GuildMember).permissions.has('MANAGE_NICKNAMES')) return interaction.reply({
            content: 'Error: You need the `MANAGE_NICKNAMES` permission to clear other member\'s nicknames.',
            ephemeral: true
        });

        // If we cannot find a member ID bail
        const memberId = selectedMember?.id ?? interaction.member?.user.id;
        if (!memberId) return interaction.reply({
            content: 'Error: No member selected',
            ephemeral: true
        });

        // If we cannot find a member bail
        const member = interaction.guild?.members.cache.get(memberId) ?? await interaction.guild?.members.fetch(memberId);
        if (!member) return interaction.reply({
            content: `Error: No member found for ${memberId}`,
            ephemeral: true
        });

        // Create the new nickname
        const displayName = member?.displayName;
        const [_, name] = /(.*)(\[.*\])/g.exec(displayName ?? '')?.values() ?? [];

        // Attempt to set the nickname
        try {
            await member.setNickname((name ?? displayName).trim());
        } catch (error: unknown) {
            logger.error(error as string);

            // Tell user the error
            return interaction.reply({
                content: 'Error: Missing Permissions',
                ephemeral: true
            });
        }

        // Success
        await interaction.reply({
            content: 'Nickname updated',
            ephemeral: true
        });
    }

    @Slash('set', {
        description: 'Set your user tag'
    })
    @SlashGroup('tag')
    async setTag(
        @SlashOption('tag', { type: 'STRING', description: 'What do you want your tag to be?' }) tag: string,
        @SlashOption('member', { type: 'USER', description: 'Who to apply the tag to', required: false }) selectedMember: GuildMember | undefined,
        interaction: CommandInteraction
    ) {
        // If the guild everyone role is missing then fetch it
        if (!interaction.guild?.roles.everyone) await interaction.guild?.roles.fetch();

        // If they selected a user and it's not themselves then check they have permission to change nicknames
        if (selectedMember && selectedMember.id !== interaction.member?.user.id && !(interaction.member as GuildMember).permissions.has('MANAGE_NICKNAMES')) return interaction.reply({
            content: 'Error: You need the `MANAGE_NICKNAMES` permission to change other member\'s nicknames.',
            ephemeral: true
        });

        // If we cannot find a member ID bail
        const memberId = selectedMember?.id ?? interaction.member?.user.id;
        if (!memberId) return interaction.reply({
            content: 'Error: No member selected',
            ephemeral: true
        });

        // If we cannot find a member bail
        const member = interaction.guild?.members.cache.get(memberId) ?? await interaction.guild?.members.fetch(memberId);
        if (!member) return interaction.reply({
            content: `Error: No member found for ${memberId}`,
            ephemeral: true
        });

        // Create the new nickname
        const displayName = member?.displayName;
        const [_, name] = /(.*)(\[.*\])/g.exec(displayName ?? '')?.values() ?? [];
        const nickname = `${(name ?? displayName).trim()} [${tag}]`;

        // If the username's name is too long
        if ((name ?? displayName).trim().length >= 29) return interaction.reply({
            content: `Error: Nickname is too long for a tag, it must be no longer than 29 characters.`,
            ephemeral: true
        });

        // If the new nickname will be too long then don't try it
        if (nickname.length > 32) return interaction.reply({
            content: `Error: Nickname + tag is too long in total they have be no more than than 29 characters.`,
            ephemeral: true
        });

        // Attempt to set the nickname
        try {
            await member.setNickname(nickname);
        } catch (error: unknown) {
            logger.error(error as string);

            // Tell the user the error
            return interaction.reply({
                content: `${error as string}`,
                ephemeral: true
            });
        }

        // Success
        await interaction.reply({
            content: 'Nickname updated',
            ephemeral: true
        });
    }
}